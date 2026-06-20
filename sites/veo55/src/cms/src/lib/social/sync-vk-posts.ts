/**
 * sync-vk-posts — чистая функция синхронизации VK-постов и комментов в Payload.
 *
 * Вызывается из двух мест:
 *  1. CLI-сид `pnpm sync:vk-posts` (`src/seed/seed-sync-vk-posts.ts`)
 *  2. Payload Jobs Task `sync-vk-posts` (`src/jobs/sync-vk-posts.task.ts`)
 *
 * Семантика 1:1 с legacy `cron-news-db-sync.php`:
 *  - wall.get → upsert в `posts` по `(source, sourceId)`
 *  - `#эксклюзив` → не сохраняем (delete если был раньше)
 *  - wall.getComments → upsert в `comments` если `db_count != vk_count`
 *  - комменты которых нет в VK ответе — удаляем из БД (модерация)
 *
 * Не делает `process.exit` — это делает caller (CLI). Возвращает summary.
 */
import type { Payload } from 'payload';

import { vkFetchWall, vkFetchComments } from './vk-adapter';

export interface SyncVkPostsArgs {
  readonly payload: Payload;
  readonly count?: number;
  /** JavaScript regex (без `/.../`) для тегов которые НЕ сохраняем. */
  readonly hideTagRegex?: string;
  readonly logger?: (msg: string) => void;
}

export interface SyncVkPostsSummary {
  readonly fetched: number;
  readonly groupName: string | undefined;
  readonly posts: { created: number; updated: number; skipped: number; purged: number };
  readonly comments: { created: number; updated: number; deleted: number };
}

const DEFAULT_HIDE_TAG_REGEX = '#экс?к?люз|#exclusive';

export async function syncVkPosts(args: SyncVkPostsArgs): Promise<SyncVkPostsSummary> {
  const { payload, count = 30, hideTagRegex = DEFAULT_HIDE_TAG_REGEX } = args;
  const log = args.logger ?? ((m) => console.log(`[sync-vk-posts] ${m}`));
  const re = new RegExp(hideTagRegex, 'i');

  log(`fetching VK wall count=${count}…`);
  const { posts, group } = await vkFetchWall(count, 0);
  log(`получено ${posts.length} постов${group?.name ? ` (${group.name})` : ''}`);

  const summary: SyncVkPostsSummary = {
    fetched: posts.length,
    groupName: group?.name,
    posts: { created: 0, updated: 0, skipped: 0, purged: 0 },
    comments: { created: 0, updated: 0, deleted: 0 },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stats = summary as any;
  const syncedAt = new Date().toISOString();

  for (const p of posts) {
    const existing = await payload.find({
      collection: 'posts',
      where: { and: [{ source: { equals: p.source } }, { sourceId: { equals: p.sourceId } }] },
      limit: 1,
      depth: 0,
    });
    const existingDoc = existing.docs[0];

    // Skip `#эксклюзив` — не в БД, существующий удаляем.
    if (re.test(p.text)) {
      if (existingDoc) {
        await payload.delete({ collection: 'posts', id: existingDoc.id });
        stats.posts.purged++;
        log(`purged sourceId=${p.sourceId}`);
      } else {
        stats.posts.skipped++;
      }
      continue;
    }

    const data = { ...p, syncedAt };
    let postDocId: string | number;
    if (existingDoc) {
      await payload.update({
        collection: 'posts',
        id: existingDoc.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      postDocId = existingDoc.id;
      stats.posts.updated++;
    } else {
      const created = await payload.create({
        collection: 'posts',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      postDocId = created.id;
      stats.posts.created++;
    }

    // ── Comments sync (delta-проверка по count) ──────────────
    if (p.metrics.comments > 0) {
      const dbCount = await payload.count({
        collection: 'comments',
        where: { post: { equals: postDocId } },
      });
      if (dbCount.totalDocs === p.metrics.comments) continue; // count match → skip

      try {
        const { items } = await vkFetchComments(p.sourceId, 100, p.sourceOwnerId);
        const flat: typeof items = [];
        const walk = (arr: typeof items) => {
          for (const c of arr) {
            flat.push(c);
            if (c.replies && c.replies.length > 0) walk(c.replies);
          }
        };
        walk(items);

        const seenIds = new Set<string>();
        for (const c of flat) {
          seenIds.add(c.id);
          const existingC = await payload.find({
            collection: 'comments',
            where: { and: [{ source: { equals: c.source } }, { sourceId: { equals: c.id } }] },
            limit: 1,
            depth: 0,
          });
          const cData = {
            source: c.source,
            sourceId: c.id,
            post: postDocId,
            sourceOwnerId: c.sourceOwnerId,
            parentId: c.parentId,
            date: c.date,
            dateIso: c.dateIso,
            text: c.text,
            author: c.author,
            likes: c.likes,
            syncedAt,
          };
          if (existingC.docs[0]) {
            await payload.update({
              collection: 'comments',
              id: existingC.docs[0].id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: cData as any,
            });
            stats.comments.updated++;
          } else {
            await payload.create({
              collection: 'comments',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: cData as any,
            });
            stats.comments.created++;
          }
        }

        // Удалить комменты которых уже нет в VK (модератор / автор удалил)
        const all = await payload.find({
          collection: 'comments',
          where: { post: { equals: postDocId } },
          limit: 1000,
          depth: 0,
        });
        for (const doc of all.docs) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sid = (doc as any).sourceId as string;
          if (!seenIds.has(sid)) {
            await payload.delete({ collection: 'comments', id: doc.id });
            stats.comments.deleted++;
          }
        }
      } catch (err) {
        log(
          `comments fetch failed for sourceId=${p.sourceId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  log(
    `OK posts(c=${summary.posts.created} u=${summary.posts.updated} s=${summary.posts.skipped} p=${summary.posts.purged}) ` +
      `comments(c=${summary.comments.created} u=${summary.comments.updated} d=${summary.comments.deleted})`,
  );
  return summary;
}
