import type { TaskConfig } from 'payload';

/**
 * Уборка отработавших кодов и прав.
 *
 * @remarks
 * Право живо, пока не вышел его срок, - живость вычисляется, а не хранится
 * флагом, поэтому истёкшее остаётся строкой в базе. У витрины такая строка
 * появляется на каждое нажатие кнопки, у сайта с продажами - на каждую покупку,
 * и через год список прав состоит в основном из мёртвых.
 *
 * То же у кодов: одноразовый срабатывает и остаётся лежать.
 *
 * Сутки после истечения - запас, чтобы не спорить с часовыми поясами и дать
 * владельцу увидеть в списке, что вчера происходило.
 *
 * Бессрочные не трогаются вовсе: пустой срок означает «навсегда», и такое право
 * живёт, пока его не снимут руками или не закроют доступ отсечкой.
 *
 * Отдельная задача, а не довесок к уборке видео: там стираются файлы в бакете,
 * здесь строки в базе, и падение одного не должно уносить другое.
 */
export const PurgeAccessTask: TaskConfig<'purge-access'> = {
  slug: 'purge-access',
  retries: 1,
  inputSchema: [],
  outputSchema: [
    { name: 'codes', type: 'number' },
    { name: 'rights', type: 'number' },
  ],
  // 4:51 - после уборки счёта ключей, чтобы ночные задачи шли по очереди.
  schedule: [{ cron: '51 4 * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const DAY_MS = 24 * 60 * 60 * 1000;
    const staleBefore = new Date(Date.now() - DAY_MS).toISOString();

    /*
      Код уходит по сроку. Исчерпанные срабатывания не считаем: сравнить два поля
      между собой запросом нельзя, а просроченным такой код станет всё равно -
      срок у кода обязателен.
    */
    const codes = await req.payload.delete({
      collection: 'media-access-codes',
      where: { expiresAt: { less_than: staleBefore } },
      overrideAccess: true,
    });

    // Право с пустым сроком - бессрочное, оно под условие не попадает.
    const rights = await req.payload.delete({
      collection: 'media-access-rights',
      where: { expiresAt: { less_than: staleBefore } },
      overrideAccess: true,
    });

    const removedCodes = codes.docs.length;
    const removedRights = rights.docs.length;
    req.payload.logger.info(
      `[task:purge-access] убрано кодов: ${removedCodes}, прав: ${removedRights}`,
    );

    return { output: { codes: removedCodes, rights: removedRights } };
  },
};
