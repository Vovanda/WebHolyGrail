import type { CollectionConfig } from 'payload';

import { slugFrom } from '../lib/slug';

/**
 * Города — справочник для каталога специалистов.
 *
 * Отдельная коллекция, а не строка в карточке человека: город нужен как фильтр
 * и как ссылка («все в Омске»), а свободный ввод даёт «Омск», «омск» и «г. Омск»
 * тремя разными городами уже на десятом специалисте.
 */
export const Cities: CollectionConfig = {
  slug: 'cities',
  labels: { singular: 'Город', plural: 'Города' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Каталог',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: { beforeValidate: [slugFrom('name')] },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Адрес в ссылке',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Заполнится сам из названия. Менять после публикации не стоит — сломает ссылки.',
      },
    },
    {
      name: 'order',
      label: 'Порядок в списке',
      type: 'number',
      admin: {
        position: 'sidebar',
        description: 'Меньше — выше. Города с одинаковым числом идут по алфавиту.',
      },
    },
  ],
};
