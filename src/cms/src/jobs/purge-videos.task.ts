import type { TaskConfig } from 'payload';

import { s3Storage } from '../lib/media/adapters';
import { purgeDeleted, type PurgeCandidate } from '../lib/media/purge';

/**
 * Уборка удалённых роликов: стирает файлы тех, кто помечен дольше срока.
 *
 * @remarks
 * Раз в сутки, ночью: работа не срочная, а списком объектов в бакете лучше
 * не шуршать в часы, когда сайт смотрят.
 *
 * Ролик, чьё стирание не удалось, остаётся помеченным и попадёт в следующий
 * проход — повторять внутри задачи незачем.
 */
export const PurgeVideosTask: TaskConfig<'purge-videos'> = {
  slug: 'purge-videos',
  retries: 1,
  inputSchema: [],
  outputSchema: [
    { name: 'purged', type: 'number' },
    { name: 'waiting', type: 'number' },
  ],
  // 4:17 — не круглое время: круглые минуты заняты у всех, кто ставил
  // расписание не задумываясь.
  schedule: [{ cron: '17 4 * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const settings = (await req.payload.findGlobal({ slug: 'site-settings', depth: 0 })) as {
      video?: { purgeAfterDays?: number | null };
    };
    const afterDays = settings?.video?.purgeAfterDays ?? 30;

    const marked = await req.payload.find({
      collection: 'media',
      where: { 'hls.deletedAt': { exists: true } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    });

    const candidates: PurgeCandidate[] = marked.docs.flatMap((doc) => {
      const hls = (doc as { hls?: { deletedAt?: string | null; prefix?: string | null } }).hls;
      if (!hls?.deletedAt) return [];
      return [{ id: doc.id, deletedAt: hls.deletedAt, prefix: hls.prefix ?? null }];
    });

    const summary = await purgeDeleted({
      candidates,
      storage: s3Storage(),
      afterDays,
      now: new Date(),
      // Запись убираем в обход перехвата удаления: он для человека в админке,
      // а здесь срок уже вышел и файлов больше нет.
      forget: async (id) => {
        await req.payload.delete({
          collection: 'media',
          id,
          overrideAccess: true,
          context: { skipDeleteGuard: true },
        });
      },
      logger: (m) => req.payload.logger.info(`[task:purge-videos] ${m}`),
    });

    return { output: { purged: summary.purged.length, waiting: summary.waiting } };
  },
};
