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
