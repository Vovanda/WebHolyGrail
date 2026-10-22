import type { CollectionConfig, Field } from 'payload';

import { editorsOnly, nobody, nobodyField } from '../lib/access/editors';

import { moneyField } from './money-field';

/**
 * Заказы магазина.
 *
 * @remarks
 * Заказ заводит только сценарий оформления (`lib/shop/orders.ts`): создавать
 * через API нельзя никому. Статус, строки и сумма в админке только читаются -
 * переходы делаются кнопками, а кнопки идут через таблицу переходов в
 * contracts. Правка поля мимо неё обошла бы автомат (docs/whg/43-shop.md).
 *
 * Менеджер правит только свою заметку: её покупатель не видит (И-8).
 */
const ro = { readOnly: true } as const;
const locked = { create: nobodyField, update: nobodyField };

export const ORDER_STATUS_OPTIONS = [
  { value: 'new', label: 'Новый' },
  { value: 'accepted', label: 'Принят' },
  { value: 'done', label: 'Выполнен' },
  { value: 'cancelled', label: 'Отменён' },
];

/** Строка заказа или счёта; деньги - целые микроединицы учёта. */
export const shopLineFields: Field[] = [
  { name: 'offer', label: 'Позиция', type: 'relationship', relationTo: 'offers' },
  { name: 'title', label: 'Название', type: 'text', required: true },
  {
    type: 'row',
    fields: [
      { name: 'quantity', label: 'Кол-во', type: 'number', required: true, min: 1 },
      moneyField('priceMicros', 'Цена', { required: true }),
      moneyField('sumMicros', 'Сумма', { admin: ro }),
    ],
  },
  {
    name: 'access',
    label: 'Доступ к видео',
    type: 'relationship',
    relationTo: 'media-accesses',
    admin: ro,
  },
];

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Заказ', plural: 'Заказы' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'status', 'totalMicros', 'buyer.name', 'createdAt'],
    group: 'Магазин',
  },
  access: { read: editorsOnly, create: nobody, update: editorsOnly, delete: nobody },
  fields: [
    {
      name: 'shopActions',
      type: 'ui',
      admin: { components: { Field: '/admin/components/ShopActionsField#ShopActionsField' } },
    },
    {
      name: 'status',
      label: 'Состояние',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: ORDER_STATUS_OPTIONS,
      access: locked,
      admin: { ...ro, position: 'sidebar' },
    },
    moneyField('totalMicros', 'Итог', {
      required: true,
      access: locked,
      admin: { ...ro, position: 'sidebar' },
    }),
    {
      name: 'buyer',
      label: 'Покупатель',
      type: 'group',
      access: locked,
      admin: ro,
      fields: [
        { name: 'name', label: 'Имя', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'phone', label: 'Телефон', type: 'text' },
            { name: 'email', label: 'Почта', type: 'text' },
          ],
        },
        { name: 'comment', label: 'Комментарий', type: 'textarea' },
      ],
    },
    {
      name: 'lines',
      label: 'Строки',
      type: 'array',
      access: locked,
      admin: ro,
      fields: [
        ...shopLineFields,
        {
          name: 'mode',
          label: 'Как купить',
          type: 'select',
          options: [
            { value: 'cart', label: 'В корзину' },
            { value: 'request', label: 'По заявке' },
          ],
          admin: ro,
        },
      ],
    },
    {
      name: 'managerNote',
      label: 'Заметка менеджера',
      type: 'textarea',
      admin: { description: 'Видит только сотрудник.' },
    },
    {
      // Хэш секрета ссылки заказа: по нему покупатель видит заказ без входа.
      // Не читается и не пишется через API ни кем.
      name: 'secretHash',
      type: 'text',
      index: true,
      access: { read: nobodyField, create: nobodyField, update: nobodyField },
      admin: { hidden: true },
    },
  ],
};
