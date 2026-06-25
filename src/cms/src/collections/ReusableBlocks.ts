import type { CollectionConfig } from 'payload';

import { REUSABLE_INNER_BLOCKS } from '../blocks';

/**
 * ReusableBlocks — атомарные «шаблонные» композиции блоков, которые можно
 * встраивать на любую страницу через блок `reusable-ref`.
 *
 * @remarks
 * Use-case: плашка достижений, контакты-врезка, CTA-промо — единое
 * содержание показывается на главной + странице помёта + about. Меняем
 * один документ → обновляется на всех страницах.
 *
 * **Внутрь нельзя класть `reusable-ref`** — иначе циклы (см. `REUSABLE_INNER_BLOCKS`
 * в `cms/src/blocks/index.ts`).
 *
 * **Гранулярность.** Один документ = один логически законченный «кусочек»
 * (плашка, врезка, CTA). Не складывать сюда «целые секции главной» —
 * для них Pages.blocks подходит лучше.
 */
export const ReusableBlocks: CollectionConfig = {
  slug: 'reusable-blocks',
  labels: { singular: 'Общая секция', plural: 'Общие секции' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'updatedAt'],
    group: 'Контент',
    description:
      'Кусочки контента для встраивания на страницы (плашка, врезка, CTA). Меняешь здесь — обновляется везде.',
  },
  versions: {
    drafts: { autosave: { interval: 800 } },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'label',
      label: 'Название (для админки)',
      type: 'text',
      required: true,
      admin: { description: 'На сайте не показывается.' },
    },
    {
      name: 'content',
      label: 'Содержимое',
      type: 'blocks',
      required: true,
      blocks: REUSABLE_INNER_BLOCKS,
    },
  ],
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
};
