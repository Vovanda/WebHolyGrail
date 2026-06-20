import type { TaskConfig } from 'payload';

import { syncVkPosts } from '../lib/social/sync-vk-posts';

/**
 * Payload Task: sync-vk-posts — синхронизация VK-постов и комментов.
 *
 * @remarks
 * Расписание: каждые 15 мин на off-minutes (`:07/:22/:37/:52`). Запускается
 * Payload runner'ом (`jobs.autoRun`) который смотрит queue 'social-sync'.
 *
 * Из UI админки (`/admin/collections/payload-jobs`) — ручной запуск кнопкой
 * «Run now» (или повторный «Retry» на failed).
 *
 * Input — опциональный override параметров (count, hideTagRegex). По дефолту
 * 30 постов и regex `#экс?к?люз|#exclusive`.
 *
 * Output — summary `{ fetched, groupName, posts{*}, comments{*} }`.
 *
 * Retries: 2 — если VK rate-limit или сетевая ошибка, повторим. Дальше — fail
 * в payload-jobs с error.
 */
export const SyncVkPostsTask: TaskConfig<'sync-vk-posts'> = {
  slug: 'sync-vk-posts',
  retries: 2,
  inputSchema: [
    {
      name: 'count',
      type: 'number',
      label: 'Сколько свежих постов забрать',
      defaultValue: 30,
      min: 1,
      max: 100,
    },
    {
      name: 'hideTagRegex',
      type: 'text',
      label: 'Regex тегов которые НЕ сохраняем',
      defaultValue: '#экс?к?люз|#exclusive',
    },
  ],
  outputSchema: [
    { name: 'fetched', type: 'number' },
    { name: 'groupName', type: 'text' },
    {
      name: 'posts',
      type: 'group',
      fields: [
        { name: 'created', type: 'number' },
        { name: 'updated', type: 'number' },
        { name: 'skipped', type: 'number' },
        { name: 'purged', type: 'number' },
      ],
    },
    {
      name: 'comments',
      type: 'group',
      fields: [
        { name: 'created', type: 'number' },
        { name: 'updated', type: 'number' },
        { name: 'deleted', type: 'number' },
      ],
    },
  ],
  schedule: [
    {
      cron: '7,22,37,52 * * * *', // каждые 15 мин на off-minutes (не палить :00/:30)
      queue: 'social-sync',
    },
  ],
  handler: async ({ input, req }) => {
    const summary = await syncVkPosts({
      payload: req.payload,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      count: (input as any)?.count,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      hideTagRegex: (input as any)?.hideTagRegex,
      logger: (m) => req.payload.logger.info(`[task:sync-vk-posts] ${m}`),
    });
    return {
      output: {
        fetched: summary.fetched,
        groupName: summary.groupName ?? '',
        posts: summary.posts,
        comments: summary.comments,
      },
    };
  },
};
