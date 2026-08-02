import type { CollectionConfig } from 'payload';

/**
 * FormSubmissions — заявки с любых форм сайта.
 *
 * @remarks
 * Инвариант (см. memo `HolyGrail/38`). Универсальная коллекция: `formType`
 * различает источник (`callback` / `litter-inquiry` / `question` ...), `data`
 * хранит произвольный JSON. Конкретные формы со своими полями появляются в
 * client, валидируют через Zod, отправляют сюда.
 *
 * Admin-доступ — только чтение и пометки статусов. Менять/удалять данные
 * заявок нельзя (юридически — это входящие сообщения от посетителей).
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Заявка', plural: 'Заявки' },
  admin: {
    useAsTitle: 'formType',
    defaultColumns: ['formType', 'status', 'createdAt', 'source'],
    group: 'Заявки',
  },
  hooks: {
    afterChange: [
      /**
       * Заявка, адресованная специалисту, увеличивает его счётчик — по нему
       * считается спрос в подборках каталога.
       *
       * Считаем только при создании: правка статуса заявки в админке не должна
       * накручивать счётчик. Ошибку глотаем осознанно — если каталога в проекте
       * нет или специалиста удалили, это не повод терять саму заявку.
       */
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return;
        const payload = (doc as { data?: Record<string, unknown> }).data ?? {};
        const raw = payload['specialistId'];
        if (!raw) return;
        // id в SQLite числовой, а из формы приходит строкой.
        const specialistId = Number(raw);
        if (!Number.isFinite(specialistId)) return;
        try {
          const current = await req.payload.findByID({
            collection: 'specialists',
            id: specialistId,
            depth: 0,
          });
          await req.payload.update({
            collection: 'specialists',
            id: specialistId,
            data: {
              requestsCount: ((current as { requestsCount?: number }).requestsCount ?? 0) + 1,
            },
          });
        } catch {
          req.payload.logger.warn(
            `Заявка ${String((doc as { id?: unknown }).id)}: не удалось засчитать её специалисту ${String(specialistId)}`,
          );
        }
      },
    ],
  },
  fields: [
    {
      name: 'formType',
      label: 'Тип формы',
      type: 'text',
      required: true,
      admin: {
        description: 'Discriminator формы: callback, question, litter-inquiry, ...',
        readOnly: true,
      },
    },
    {
      name: 'data',
      label: 'Данные заявки',
      type: 'json',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'status',
      label: 'Статус обработки',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'Новая', value: 'new' },
        { label: 'В работе', value: 'in_progress' },
        { label: 'Закрыта', value: 'done' },
        { label: 'Спам', value: 'spam' },
      ],
    },
    {
      name: 'source',
      label: 'Источник',
      type: 'text',
      admin: {
        description: 'URL страницы, UTM, реферер. Заполняется фронтом.',
        readOnly: true,
      },
    },
  ],
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => true, // публичная отправка с фронта.
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
