import type { Block } from 'payload';

/**
 * ReusableRef — вставка переиспользуемого блока на страницу.
 *
 * @remarks
 * Содержимое тянется из коллекции `reusable-blocks` по `ref`. Меняешь
 * запись там — обновляется на всех страницах где встроен (без копипасты,
 * без рассинхрона).
 *
 * Сам этот блок **запрещён** внутри `ReusableBlocks.content` — иначе
 * получаются циклы ссылок (см. `REUSABLE_INNER_BLOCKS` в `index.ts`).
 */
export const ReusableRefBlock: Block = {
  slug: 'reusable-ref',
  labels: { singular: 'Общая секция', plural: 'Общие секции' },
  fields: [
    {
      name: 'ref',
      label: 'Секция',
      type: 'relationship',
      relationTo: 'reusable-blocks',
      required: true,
      admin: { description: 'Содержимое подставится из коллекции «Общие секции».' },
    },
  ],
};
