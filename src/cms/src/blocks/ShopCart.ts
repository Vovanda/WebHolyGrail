import type { Block } from 'payload';

/**
 * Корзина и оформление заказа (docs/whg/43-shop.md).
 *
 * @remarks
 * Корзина живёт в браузере посетителя; блок показывает её и форму заказа.
 * Ставится на свою страницу - её адрес указывается в витрине.
 */
export const ShopCartBlock: Block = {
  slug: 'shop-cart',
  labels: { singular: 'Корзина', plural: 'Корзины' },
  fields: [
    { name: 'heading', label: 'Заголовок', type: 'text', defaultValue: 'Корзина' },
    {
      name: 'emptyText',
      label: 'Текст пустой корзины',
      type: 'text',
      defaultValue: 'В корзине пока пусто.',
    },
    {
      name: 'policyHref',
      label: 'Адрес политики обработки данных',
      type: 'text',
      defaultValue: '/privacy',
    },
  ],
};
