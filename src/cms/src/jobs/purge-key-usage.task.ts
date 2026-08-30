import type { TaskConfig } from 'payload';

/**
 * Уборка счёта ключей: строки, которых давно не касались.
 *
 * @remarks
 * Строка счёта заводится на каждую идентичность - у живого сайта это строка
 * на посетителя, и остаётся она навсегда. Нужна она куда меньше: запас
 * восполняется за минуты, а выданные ключи помнятся полчаса.
 *
 * Сутки взяты с запасом: к этому времени в строке заведомо нет ничего, кроме
 * полного запаса и пустого списка ключей. Считать её на день дольше дешевле,
 * чем спорить с часовыми поясами.
 *
 * Отдельная задача, а не довесок к уборке видео: там стираются файлы в бакете,
 * здесь строки в базе, и падение одного не должно уносить другое.
 */
export const PurgeKeyUsageTask: TaskConfig<'purge-key-usage'> = {
  slug: 'purge-key-usage',
  retries: 1,
  inputSchema: [],
  outputSchema: [{ name: 'purged', type: 'number' }],
  // 4:41 - после уборки видео, чтобы две ночные задачи не начинали разом.
  schedule: [{ cron: '41 4 * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const staleBefore = new Date(Date.now() - DAY_MS).toISOString();

    const removed = await req.payload.delete({
      collection: 'key-usage',
      where: { updatedAt: { less_than: staleBefore } },
      overrideAccess: true,
    });

    const purged = removed.docs.length;
    req.payload.logger.info(`[task:purge-key-usage] убрано строк: ${purged}`);
    return { output: { purged } };
  },
};
