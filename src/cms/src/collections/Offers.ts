import type { CollectionConfig } from 'payload';
import { isSlug } from 'contracts';

import { editorsOnly } from '../lib/access/editors';
import { moneyField } from './money-field';

/**
 * Позиции магазина - всё, что сайт продаёт: товар, курс, щенок.
 *
 * @remarks
 * Одна коллекция на любой бизнес (docs/whg/43-shop.md). Штучная позиция - это
 * остаток 1, отдельного режима нет. Цену владелец вводит в рублях, в базе она
 * целым в микроединицах учёта (docs/adr/002-money.md).
 *
 * Читают только редакторы: витрина и корзина берут позиции ручкой
 * `/api/shop/offers`, где цена выходит `Money`, а не сырым числом.
 */
export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Позиция', plural: 'Позиции' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'section', 'priceMicros', 'stock', 'updatedAt'],
    group: 'Магазин',
    description: 'Что продаёт сайт. Витрина на странице показывает эти позиции.',
  },
  access: { read: editorsOnly, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, maxLength: 200 },
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
          'Страница позиции - /shop/item/<адрес>. Заполнится сам из названия; после публикации не менять.',
      },
    },
    {
      name: 'hasPage',
      label: 'Своя страница',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Выключено - карточка на витрине без ссылки, страницы позиции нет.',
      },
    },
    {
      name: 'sku',
      label: 'Артикул',
      type: 'text',
      index: true,
      maxLength: 64,
      admin: {
        position: 'sidebar',
        description: 'Код позиции у продавца; покупатель видит его на карточке и копирует.',
      },
    },
    {
      name: 'section',
      label: 'Раздел каталога',
      type: 'relationship',
      relationTo: 'catalog-sections',
      admin: { position: 'sidebar', description: 'От раздела зависят характеристики позиции.' },
    },
    { name: 'image', label: 'Картинка', type: 'upload', relationTo: 'media' },
    {
      name: 'gallery',
      label: 'Галерея',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Ещё картинки для страницы позиции; первой идёт «Картинка».' },
    },
    { name: 'summary', label: 'Короткое описание', type: 'textarea', maxLength: 500 },
    {
      type: 'row',
      fields: [
        {
          name: 'keywords',
          label: 'Другие названия',
          type: 'text',
          maxLength: 300,
          admin: {
            description:
              'Как ещё называют товар, через запятую: роутер, маршрутизатор. Необязательно.',
          },
        },
        {
          name: 'tags',
          label: 'Теги',
          type: 'text',
          hasMany: true,
          maxRows: 20,
          admin: { description: 'Метки товара для поиска магазина. Необязательно.' },
        },
      ],
    },
    { name: 'description', label: 'Описание', type: 'richText' },
    {
      name: 'specs',
      label: 'Характеристики',
      type: 'json',
      admin: {
        description: 'Поля по характеристикам выбранного раздела.',
        components: { Field: '/admin/components/OfferSpecsField#OfferSpecsField' },
      },
    },
    {
      type: 'row',
      fields: [
        moneyField('priceMicros', 'Цена', {
          admin: { description: 'Пусто или 0 - «цена по запросу», в корзину не кладётся.' },
        }),
        moneyField('promoPriceMicros', 'Цена по акции', {
          admin: {
            description: 'Ниже цены - покупатель видит её, а цену зачёркнутой. Пусто - акции нет.',
          },
        }),
        {
          name: 'promoUntil',
          label: 'Акция до',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Пусто - пока цену по акции не уберут.',
          },
        },
        {
          name: 'stock',
          label: 'Остаток',
          type: 'number',
          min: 0,
          admin: {
            step: 1,
            description:
              'Пусто - без ограничений. 1 - штучная позиция: после заказа уходит из продажи.',
          },
        },
      ],
    },
    {
      name: 'howToBuy',
      label: 'Как купить',
      type: 'select',
      required: true,
      defaultValue: 'cart',
      options: [
        { value: 'cart', label: 'В корзину' },
        { value: 'request', label: 'По заявке' },
      ],
      admin: {
        description:
          'По заявке - остаток списывается, когда вы примете заказ; до этого позиция остаётся на витрине.',
      },
    },
    moneyField('depositMicros', 'Бронь', {
      admin: {
        description:
          'Часть цены вперёд. Сначала выставляется счёт на бронь, потом основной - на цену минус бронь.',
      },
    }),
  ],
};
