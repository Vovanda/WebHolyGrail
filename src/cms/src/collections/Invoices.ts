import { APIError, type CollectionConfig } from 'payload';

import { editorsOnly, isEditor, nobody, nobodyField } from '../lib/access/editors';
import { draftLines } from '../lib/shop/invoices';
import { lineToDoc, orderFromDoc } from '../lib/shop/payload-store';
import { moneyField } from './money-field';
import { shopLineFields } from './Orders';

/**
 * Счета и счета-возвраты.
 *
 * @remarks
 * Счёт заводится кнопкой на заказе, возврат - кнопкой на оплаченном счёте;
 * через «Создать» его не завести. Переходы - кнопками через таблицу в
 * contracts. Менеджер правит только черновик: строки, цены, доставку, срок.
 * Хук сверяет строки черновика с заказом той же функцией, что и сценарий
 * (`draftLines`): количество позиции из заказа не меняется, суммы считает сервер.
 * Вне черновика итог и срок держатся прежними при любой записи: это части
 * выставленного документа, и правка через REST их не трогает.
 */
const ro = { readOnly: true } as const;
const locked = { create: nobodyField, update: nobodyField };
const isDraft = (data: Record<string, unknown> | undefined): boolean =>
  data?.['status'] === 'draft';

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { singular: 'Счёт', plural: 'Счета' },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['id', 'kind', 'status', 'totalMicros', 'order', 'dueAt'],
    group: 'Магазин',
  },
  access: { read: editorsOnly, create: nobody, update: editorsOnly, delete: nobody },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (operation !== 'update' || !originalDoc) return data;
        if (!isDraft(originalDoc) || originalDoc['kind'] !== 'invoice') {
          return {
            ...data,
            totalMicros: originalDoc['totalMicros'],
            dueAt: originalDoc['dueAt'] ?? null,
          };
        }
        const orderId = originalDoc['order'];
        const orderDoc = await req.payload.findByID({
          collection: 'orders',
          id:
            typeof orderId === 'object' && orderId
              ? (orderId as { id: number }).id
              : (orderId as number),
          depth: 0,
          overrideAccess: true,
          req,
        });
        const lines = draftLines(
          orderFromDoc(orderDoc as unknown as Record<string, unknown>),
          ((data['lines'] ?? originalDoc['lines'] ?? []) as Record<string, unknown>[]).map((l) => ({
            offer: l['offer'] === null || l['offer'] === undefined ? null : Number(l['offer']),
            title: String(l['title'] ?? ''),
            quantity: Number(l['quantity']),
            price: Number(l['priceMicros']),
          })),
        );
        if (!lines.ok) {
          // APIError со статусом: менеджер видит причину, а не «внутреннюю ошибку».
          throw new APIError(
            lines.error === 'quantity_locked'
              ? 'Количество позиции берётся из заказа. Другое количество - отменить заказ и оформить заново.'
              : 'Строка счёта заполнена неверно: название, количество от 1 и цена от 0.',
            400,
            undefined,
            true,
          );
        }
        return {
          ...data,
          lines: lines.value.map(lineToDoc),
          totalMicros: lines.value.reduce((t, l) => t + l.sum, 0),
        };
      },
    ],
  },
  fields: [
    {
      name: 'shopActions',
      type: 'ui',
      admin: { components: { Field: '/admin/components/ShopActionsField#ShopActionsField' } },
    },
    {
      name: 'kind',
      label: 'Вид',
      type: 'select',
      required: true,
      defaultValue: 'invoice',
      options: [
        { value: 'invoice', label: 'Счёт на оплату' },
        { value: 'refund', label: 'Возврат' },
      ],
      access: locked,
      admin: { ...ro, position: 'sidebar' },
    },
    {
      name: 'purpose',
      label: 'Назначение',
      type: 'select',
      required: true,
      defaultValue: 'payment',
      options: [
        { value: 'payment', label: 'Оплата позиций' },
        { value: 'deposit', label: 'Бронь' },
      ],
      access: locked,
      admin: { ...ro, position: 'sidebar', condition: (data) => data?.['kind'] === 'invoice' },
    },
    {
      name: 'status',
      label: 'Состояние',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Черновик' },
        { value: 'issued', label: 'Выставлен' },
        { value: 'reported', label: 'Оплата заявлена' },
        { value: 'paid', label: 'Оплачен' },
        { value: 'voided', label: 'Аннулирован' },
      ],
      access: locked,
      admin: { ...ro, position: 'sidebar' },
    },
    {
      name: 'order',
      label: 'Заказ',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      access: locked,
      admin: { ...ro, position: 'sidebar' },
    },
    {
      name: 'refundOf',
      label: 'Возвращает счёт',
      type: 'relationship',
      relationTo: 'invoices',
      access: locked,
      admin: { ...ro, position: 'sidebar', condition: (data) => data?.['kind'] === 'refund' },
    },
    {
      name: 'dueAt',
      label: 'Оплатить до',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: false,
        condition: (data) => data?.['kind'] === 'invoice',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
      },
    },
    moneyField('totalMicros', 'Итог', {
      required: true,
      access: { create: nobodyField },
      admin: { ...ro, position: 'sidebar' },
    }),
    {
      name: 'lines',
      label: 'Строки',
      type: 'array',
      // Правится только черновик счёта на оплату; выставленный не меняется (И-3).
      access: {
        create: nobodyField,
        update: ({ req: { user }, doc }) =>
          isEditor(user) && isDraft(doc as Record<string, unknown>) && doc?.['kind'] === 'invoice',
      },
      admin: {
        description:
          'В черновике правится цена и добавляются свои строки - доставка, курс. Количество позиции из заказа не меняется.',
      },
      fields: shopLineFields,
    },
    {
      name: 'codes',
      label: 'Выданные коды',
      type: 'array',
      access: locked,
      admin: {
        ...ro,
        condition: (data) => Array.isArray(data?.['codes']) && data['codes'].length > 0,
      },
      fields: [
        { name: 'line', type: 'number' },
        { name: 'codeId', type: 'text' },
        { name: 'code', label: 'Код', type: 'text' },
      ],
    },
  ],
};
