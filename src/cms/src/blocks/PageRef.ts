import type { Block } from 'payload';

/**
 * PageRef — встраивает содержимое другой страницы (`Pages.blocks`) внутрь
 * текущей. Аналог `reusable-ref`, но источник — `Pages`, а не `ReusableBlocks`.
 *
 * @remarks
 * Use-case: целиком встроить «О business в страницу помёта; вложить
 * «Контакты» в FAQ. Меняешь исходную страницу → подтягивается во все где
 * встроена.
 *
 * **Запрещён внутри `ReusableBlocks.content`** (см. `REUSABLE_INNER_BLOCKS`)
 * — иначе разбегаются циклы (page → reusable → page → reusable…).
 *
 * **Циклы Pages↔Pages** ловит рендерер на клиенте через depth-guard
 * (см. `client/blocks/primitives/PageRef.tsx`).
 */
export const PageRefBlock: Block = {
  slug: 'page-ref',
  labels: { singular: 'Содержимое другой страницы', plural: 'Содержимое других страниц' },
  fields: [
    {
      name: 'ref',
      label: 'Страница',
      type: 'relationship',
      relationTo: 'pages',
      required: true,
      admin: { description: 'Блоки выбранной страницы отрендерятся целиком.' },
    },
  ],
};
