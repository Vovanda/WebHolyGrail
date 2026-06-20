/**
 * seed-sync-vk-posts — синхронизирует VK-посты сообщества в Posts collection.
 *
 * Аналог legacy `cron-news-db-sync.php`: дёргает wall.get на N свежих постов,
 * upsert'ит в Payload Posts (source='vk', sourceId=vk_post_id). Опционально
 * можно запустить через cron каждые 30 мин.
 *
 * **Skip-фильтр `#эксклюзив`.** Посты с таким тегом — эксклюзив для VK-группы,
 * на нашем сайте быть не должны → **не сохраняем в БД** (вообще). Если такой
 * пост уже есть (заводчик добавил тег после публикации) — удаляем при sync.
 * Регэксп через ENV `VEO_SYNC_HIDE_TAG_REGEX` (default `#экс?к?люз`).
 *
 * Запуск: pnpm --filter veo55-cms sync:vk-posts [count]
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;
const { vkFetchWall, vkFetchComments } = await import('../lib/social/vk-adapter');

async function main() {
  const count = Number(process.argv[2] ?? 30);
  // Регэксп тегов которые НЕ сохраняем в БД. По дефолту — `#эксклюзив` любой
  // вариант написания (#эксклюз / #экслюз / #эксклюзив / #exclusive).
  const hideTagRegexSource = process.env.VEO_SYNC_HIDE_TAG_REGEX ?? '#экс?к?люз|#exclusive';
  const hideTagRegex = new RegExp(hideTagRegexSource, 'i');

  console.log(`[sync:vk-posts] starting, count=${count}, hideTagRegex=/${hideTagRegexSource}/i…`);
  const payload = await getPayload({ config });

  console.log('[sync:vk-posts] fetching VK wall…');
  const { posts, group } = await vkFetchWall(count, 0);
  console.log(
    `[sync:vk-posts] получено ${posts.length} постов из VK${group?.name ? ` (${group.name})` : ''}`,
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let purged = 0;
  let commentsCreated = 0;
  let commentsUpdated = 0;
  let commentsDeleted = 0;
  const syncedAt = new Date().toISOString();
  for (const p of posts) {
    const existing = await payload.find({
      collection: 'posts',
      where: {
        and: [{ source: { equals: p.source } }, { sourceId: { equals: p.sourceId } }],
      },
      limit: 1,
      depth: 0,
    });
    const existingDoc = existing.docs[0];

    // Skip-фильтр: если пост помечен `#эксклюзив` — не сохраняем, а
    // если был сохранён раньше (без тега) — удаляем теперь.
    if (hideTagRegex.test(p.text)) {
      if (existingDoc) {
        await payload.delete({ collection: 'posts', id: existingDoc.id });
        purged++;
        console.log(
          `[sync:vk-posts] purged sourceId=${p.sourceId} (text matched hide-regex, был в БД)`,
        );
      } else {
        skipped++;
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
      updated++;
    } else {
      const createdDoc = await payload.create({
        collection: 'posts',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      postDocId = createdDoc.id;
      created++;
    }

    // ── Sync комментов ─────────────────────────────────────────
    // Если у поста есть комменты — проверяем количество в БД vs VK.
    // Если совпадает — пропускаем (delta-фильтр, экономим VK-запросы как
    // в legacy `cron-news-db-sync.php`). Иначе тянем все комменты заново
    // (replies включаются через thread_items_count=10).
    if (p.metrics.comments > 0) {
      const dbCount = await payload.count({
        collection: 'comments',
        where: { post: { equals: postDocId } },
      });
      if (dbCount.totalDocs === p.metrics.comments) {
        // delta: count совпадает — ничего не изменилось, пропускаем.
        continue;
      }
      try {
        const { items } = await vkFetchComments(p.sourceId, 100, p.sourceOwnerId);
        // Flatten replies в плоский список (parentId связь сохраняется).
        const flat: typeof items = [];
        const walk = (arr: typeof items) => {
          for (const c of arr) {
            flat.push(c);
            if (c.replies && c.replies.length > 0) walk(c.replies);
          }
        };
        walk(items);

        // Upsert каждого коммента
        const seenIds = new Set<string>();
        for (const c of flat) {
          seenIds.add(c.id);
          const existingC = await payload.find({
            collection: 'comments',
            where: {
              and: [{ source: { equals: c.source } }, { sourceId: { equals: c.id } }],
            },
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
            commentsUpdated++;
          } else {
            await payload.create({
              collection: 'comments',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: cData as any,
            });
            commentsCreated++;
          }
        }

        // Удалить из БД комменты которых уже нет в VK (комментатор удалил
        // или модератор скрыл). Сравнение по sourceId, scope — этот пост.
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
            commentsDeleted++;
          }
        }
      } catch (err) {
        // VK rate-limit / network — не валим весь sync.
        console.warn(`[sync:vk-posts] comments fetch failed for sourceId=${p.sourceId}:`, err);
      }
    }
  }

  console.log(
    `[sync:vk-posts] OK. posts: created=${created} updated=${updated} skipped=${skipped} purged=${purged}. ` +
      `comments: created=${commentsCreated} updated=${commentsUpdated} deleted=${commentsDeleted}.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync:vk-posts] FAILED:', err);
  process.exit(1);
});
