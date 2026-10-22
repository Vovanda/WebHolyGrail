import type { CollectionConfig } from 'payload';

import { editorsOnly } from '../lib/access/editors';
import { moneyField } from './money-field';

/**
 * Позиции магазина - всё, что сайт продаёт: товар, курс, доступ к видео, щенок.
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
    defaultColumns: ['title', 'priceMicros', 'stock', 'updatedAt'],
    group: 'Магазин',
    description: 'Что продаёт сайт. Витрина на странице показывает эти позиции.',
  },
  access: { read: editorsOnly, create: editorsOnly, update: editorsOnly, delete: editorsOnly },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, maxLength: 200 },
    {
      type: 'row',
      fields: [
        moneyField('priceMicros', 'Цена', {
          admin: { description: 'Пусто - «цена по запросу», в корзину не кладётся.' },
        }),
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
    { name: 'image', label: 'Картинка', type: 'upload', relationTo: 'media' },
    { name: 'summary', label: 'Коротко', type: 'textarea', maxLength: 500 },
    {
      name: 'access',
      label: 'Доступ к видео',
      type: 'relationship',
      relationTo: 'media-accesses',
      admin: {
        description:
          'Если позиция продаёт видео: после оплаты счёта покупатель получит код к этому доступу.',
      },
    },
  ],
};
