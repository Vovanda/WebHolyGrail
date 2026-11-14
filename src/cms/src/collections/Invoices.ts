import type { ExtraLineInput } from 'contracts';
import { APIError, type CollectionConfig } from 'payload';

import { editorsOnly, isEditor, nobody, nobodyField } from '../lib/access/editors';
import { checkedExtra } from '../lib/shop/invoices';
import { extraToDoc, invoiceFromDoc, lineToDoc, payloadPorts } from '../lib/shop/payload-store';
import { moneyField } from './money-field';
import { shopLineFields } from './Orders';

/**
 * Счета и счета-возвраты.
 *
 * @remarks
 * Счёт заводится кнопкой на заказе, возврат - кнопкой на оплаченном счёте;
 * через «Создать» его не завести. Переходы - кнопками через таблицу в
 * contracts. Строки из заказа - копия живых строк, они не правятся вовсе. В черновике
 * менеджер правит добавленные строки и срок; хук проверяет их той же функцией, что
 * и сценарий (`checkedExtra`), суммы и итог считает сервер.
 * Вне черновика итог и срок держатся прежними при любой записи: это части
 * выставленного документа, и правка через REST их не трогает.
 */
const ro = { readOnly: true } as const;
const locked = { create: nobodyField, update: nobodyField };
const EXTRA_ERRORS: Record<string, string> = {
  deposit_extra: 'У счёта на бронь добавленных строк нет: доставку и скидку - в основной счёт.',
  invalid:
    'Добавленная строка заполнена неверно: у своей строки и скидки - название и сумма, у позиции - позиция каталога с ценой.',
  discount_too_large: 'Скидка больше суммы строки или заказа, на которую она дана.',
};

/** Строка формы в ввод сценария: числа и связи как их отдаёт форма Payload. */
const extraInput = (l: Record<string, unknown>): ExtraLineInput => {
  const id = (v: unknown): number | null =>
    v === null || v === undefined || v === ''
      ? null
      : Number(typeof v === 'object' ? (v as { id: unknown }).id : v);
  return {
    kind: (l['kind'] as ExtraLineInput['kind']) ?? 'charge',
    title: String(l['title'] ?? ''),
    offer: id(l['offer']),
    quantity: Number(l['quantity'] ?? 1),
    price: Number(l['priceMicros'] ?? 0),
    appliesTo: id(l['appliesTo']),
  };
};

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
        // Строки из заказа не правятся (И-3); добавленные проверяет сценарий счёта.
        const invoice = invoiceFromDoc(originalDoc as Record<string, unknown>);
        const input = ((data['extraLines'] ?? []) as Record<string, unknown>[]).map(extraInput);
        const extra = await checkedExtra(payloadPorts(req.payload, req), invoice, input);
        if (!extra.ok) {
          // APIError со статусом: менеджер видит причину, а не «внутреннюю ошибку».
          throw new APIError(
            EXTRA_ERRORS[extra.error] ?? EXTRA_ERRORS['invalid']!,
            400,
            undefined,
            true,
          );
        }
        return {
          ...data,
          lines: extra.value.lines.map(lineToDoc),
          extraLines: extra.value.extra.map(extraToDoc),
          totalMicros: invoice.lines.reduce((t, l) => t + l.sum, 0) + extra.value.sum,
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
      label: 'Строки из заказа',
      labels: { singular: 'строку', plural: 'строк' },
      type: 'array',
      // Копия живых строк заказа: остаток списан по заказу, счёт их не меняет (И-3).
      access: locked,
      admin: {
        ...ro,
        description:
          'Строки заказа без снятых. Не правятся: другое количество или цена - через заказ.',
        disableListColumn: true,
        components: { RowLabel: '/admin/components/ShopLineRowLabel#ShopLineRowLabel' },
      },
      fields: [...shopLineFields, moneyField('discountMicros', 'Доля скидки', { admin: ro })],
    },
    {
      name: 'extraLines',
      label: 'Добавленные строки',
      labels: { singular: 'строку', plural: 'строк' },
      type: 'array',
      access: {
        create: nobodyField,
        update: ({ req: { user }, doc }) =>
          isEditor(user) && isDraft(doc as Record<string, unknown>) && doc?.['kind'] === 'invoice',
      },
      admin: {
        description:
          'Доставка и свои строки, позиция каталога по цене каталога, скидка на строку или на заказ.',
        disableListColumn: true,
        // У счёта на бронь добавленных строк нет: бронь - фиксированная часть цены.
        condition: (data) => data?.['purpose'] !== 'deposit',
        components: { RowLabel: '/admin/components/ShopLineRowLabel#ShopLineRowLabel' },
      },
      fields: [
        {
          name: 'kind',
          label: 'Что это',
          type: 'select',
          required: true,
          defaultValue: 'charge',
          options: [
            { value: 'charge', label: 'Своя строка' },
            { value: 'offer', label: 'Позиция каталога' },
            { value: 'discount', label: 'Скидка' },
          ],
        },
        {
          name: 'offer',
          label: 'Позиция',
          type: 'relationship',
          relationTo: 'offers',
          admin: { condition: (_, row) => row?.['kind'] === 'offer' },
        },
        {
          name: 'title',
          label: 'Название',
          type: 'text',
          admin: {
            condition: (_, row) => row?.['kind'] !== 'offer',
            description: 'Доставка, упаковка; у скидки - что за скидка: промокод, день рождения.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              label: 'Кол-во',
              type: 'number',
              min: 1,
              defaultValue: 1,
              admin: { condition: (_, row) => row?.['kind'] !== 'discount' },
            },
            moneyField('priceMicros', 'Цена или скидка', {
              admin: {
                condition: (_, row) => row?.['kind'] !== 'offer',
                description: 'У позиции каталога цена берётся из каталога.',
              },
            }),
            moneyField('sumMicros', 'Сумма', { admin: ro }),
          ],
        },
        {
          name: 'appliesTo',
          label: 'Скидка на позицию',
          type: 'relationship',
          relationTo: 'offers',
          admin: {
            condition: (_, row) => row?.['kind'] === 'discount',
            description:
              'Пусто - скидка на весь заказ: она раскладывается по строкам, доля видна у строки.',
          },
        },
      ],
    },
    {
      // Пишется вместе с аннулированием (lib/shop/invoices): руками не правится.
      name: 'voidReason',
      label: 'Почему аннулирован',
      type: 'text',
      access: locked,
      admin: {
        readOnly: true,
        description: 'Её видит покупатель на странице заказа.',
        condition: (data) => data?.['status'] === 'voided',
      },
    },
  ],
};
