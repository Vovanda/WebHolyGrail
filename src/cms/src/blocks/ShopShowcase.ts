import type { Block } from 'payload';

import { withTileLayout } from './_tile-layout';

/**
 * Витрина магазина: плитка позиций с кнопкой «В корзину» (docs/whg/43-shop.md).
 *
 * @remarks
 * Позиции - из коллекции «Позиции». Не выбрано ни одной - показываются все по
 * названию: владельцу с десятком позиций не нужно перечислять их вручную.
 */
const shopShowcaseBase: Block = {
  slug: 'shop-showcase',
  labels: { singular: 'Витрина', plural: 'Витрины' },
  fields: [
    { name: 'heading', label: 'Заголовок', type: 'text' },
    { name: 'description', label: 'Пояснение', type: 'textarea' },
    {
      name: 'offers',
      label: 'Позиции',
      type: 'relationship',
      relationTo: 'offers',
      hasMany: true,
      admin: { description: 'Пусто - все позиции магазина по названию.' },
    },
    {
      name: 'cartHref',
      label: 'Адрес корзины',
      type: 'text',
      defaultValue: '/cart',
      admin: { description: 'Страница, на которой стоит блок «Корзина».' },
    },
  ],
};

export const ShopShowcaseBlock: Block = withTileLayout(shopShowcaseBase);
