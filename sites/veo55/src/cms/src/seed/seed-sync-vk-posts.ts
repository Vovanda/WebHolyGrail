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
const { vkFetchWall } = await import('../lib/social/vk-adapter');

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
    if (existingDoc) {
      await payload.update({
        collection: 'posts',
        id: existingDoc.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      updated++;
    } else {
      await payload.create({
        collection: 'posts',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as any,
      });
      created++;
    }
  }

  console.log(
    `[sync:vk-posts] OK. created=${created} updated=${updated} skipped=${skipped} purged=${purged}.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[sync:vk-posts] FAILED:', err);
  process.exit(1);
});
