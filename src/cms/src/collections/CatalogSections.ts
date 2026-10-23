import type { CollectionConfig, PayloadRequest } from 'payload';
import { isSlug, SHOP_CHARACTERISTICS } from 'contracts';

import { editorsOnly } from '../lib/access/editors';

/**
 * Разделы каталога: у каждого свой набор характеристик (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Характеристика - данные, а не поле схемы: владелец заводит «Толщину» или
 * «Материал» здесь, и у позиций раздела появляется поле под неё, без
 * разработчика и без миграции. Разбор и проверка - `cleanCharacteristics`
 * в contracts, общие для CMS и сайта (R3).
 *
 * Раздел открывается на сайте по адресу `/shop/<слаг>`: плитка позиций,
 * фильтр по характеристикам и поиск.
 */
export const CatalogSections: CollectionConfig = {
  slug: 'catalog-sections',
  labels: { singular: 'Раздел каталога', plural: 'Разделы каталога' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    group: 'Магазин',
    description:
      'Разделы витрины и их характеристики. Раздел открывается на сайте по адресу /shop/<адрес>.',
  },
  access: { read: () => true, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  hooks: {
    // Позиции раздела остаются вне разделов: без этого внешний ключ offers.section_id
    // не даёт удалить раздел, в котором есть хоть одна позиция.
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.update({
          collection: 'offers',
          where: { section: { equals: id } },
          data: { section: null },
          overrideAccess: true,
          req,
        });
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, maxLength: 120 },
    {
      name: 'slug',
      label: 'Адрес в ссылке',
      type: 'text',
      unique: true,
      index: true,
      validate: (value: unknown) =>
        value === null || value === undefined || value === '' || isSlug(value)
          ? true
          : 'Только латиница в нижнем регистре, цифры и дефис, до 120 знаков.',
      admin: {
        position: 'sidebar',
        description:
          'Заполнится сам из названия. Менять после публикации не стоит - сломает ссылки.',
      },
    },
    { name: 'description', label: 'Описание', type: 'textarea', maxLength: 1000 },
    {
      name: 'parent',
      label: 'Родительский раздел',
      type: 'relationship',
      relationTo: 'catalog-sections',
      filterOptions: ({ id }) => (id ? { id: { not_equals: id } } : true),
      validate: async (
        value: unknown,
        { req, id }: { req: PayloadRequest; id?: string | number },
      ) => {
        // Вверх по родителям: встретили себя - раздел оказался бы внутри самого себя.
        let at = relationId(value);
        for (let step = 0; at !== null && step < 50; step += 1) {
          if (id !== undefined && String(at) === String(id)) {
            return 'Раздел не может лежать внутри самого себя или своего подраздела.';
          }
          const doc = await req.payload
            .findByID({
              collection: 'catalog-sections',
              id: at,
              depth: 0,
              overrideAccess: true,
              req,
            })
            .catch(() => null);
          at = relationId((doc as { parent?: unknown } | null)?.parent);
        }
        return true;
      },
      admin: {
        position: 'sidebar',
        description: 'Пусто - верхний раздел. Позиции подраздела видны и в родительском.',
      },
    },
    {
      name: 'image',
      label: 'Картинка',
      type: 'upload',
      relationTo: 'media',
      admin: { position: 'sidebar', description: 'Для плитки раздела в каталоге.' },
    },
    {
      name: 'characteristics',
      label: 'Характеристики',
      labels: { singular: 'характеристику', plural: 'характеристик' },
      type: 'array',
      admin: {
        description:
          'По ним позиции раздела фильтруются и сравниваются. Порядок здесь - порядок в карточке и в фильтре.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'title', label: 'Название', type: 'text', required: true, maxLength: 60 },
            {
              name: 'key',
              label: 'Ключ',
              type: 'text',
              required: true,
              maxLength: 32,
              admin: { description: 'Латиница, цифры, дефис - так характеристика стоит в адресе.' },
              validate: (value: unknown) =>
                typeof value !== 'string' || !/^[a-z0-9-]{1,32}$/.test(value)
                  ? 'Только строчная латиница, цифры и дефис.'
                  : SHOP_CHARACTERISTICS.some((c) => c.key === value)
                    ? 'Ключ занят общей характеристикой магазина: наличие, скидка, цена.'
                    : true,
            },
            { name: 'unit', label: 'Единица', type: 'text', maxLength: 16 },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              label: 'Значение',
              type: 'select',
              required: true,
              defaultValue: 'enum',
              options: [
                { value: 'enum', label: 'Из перечня' },
                { value: 'number', label: 'Число' },
                { value: 'bool', label: 'Да или нет' },
                { value: 'text', label: 'Текст' },
              ],
            },
            {
              name: 'filter',
              label: 'В фильтре',
              type: 'select',
              required: true,
              defaultValue: 'checks',
              options: [
                { value: 'checks', label: 'Галочки' },
                { value: 'range', label: 'От и до' },
                { value: 'hidden', label: 'Не показывать' },
              ],
            },
            { name: 'group', label: 'Группа', type: 'text', maxLength: 40 },
            {
              name: 'inCard',
              label: 'В карточке',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'quick',
              label: 'В быстрых фильтрах',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Значения строкой над плиткой раздела.' },
            },
          ],
        },
      ],
    },
  ],
};

/** Номер записи из значения связи: число, строка или прочитанный документ. */
function relationId(value: unknown): string | number | null {
  if (typeof value === 'number' || (typeof value === 'string' && value)) return value;
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id;
    return typeof id === 'number' || typeof id === 'string' ? id : null;
  }
  return null;
}
