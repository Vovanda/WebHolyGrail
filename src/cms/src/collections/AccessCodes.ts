import type { CollectionConfig } from 'payload';

import { generateShortCode } from '../lib/video/short-code';

/**
 * AccessCodes — коды и ссылки, открывающие плейлист.
 *
 * @remarks
 * Способ выдачи права, а не отдельный вид доступа: код срабатывает и
 * превращается в обычное право «зритель × плейлист». Когда придёт платёжка,
 * она встанет рядом и будет создавать такие же права.
 *
 * Ключевая настройка — нужен ли вход. Платный доступ выдаётся с входом: иначе
 * его нельзя ни отозвать адресно, ни посчитать, а разошедшийся по чатам код
 * открывает плейлист всем, кто его увидел. Бесплатный промо-доступ уместно
 * отдавать без регистрации — там цель в том, чтобы человек не спотыкался.
 */
export const AccessCodes: CollectionConfig = {
  slug: 'access-codes',
  labels: { singular: 'Код доступа', plural: 'Коды доступа' },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'playlist', 'requiresSignIn', 'usedCount', 'expiresAt'],
    group: 'Медиа',
    description: 'Открывают плейлист по коду или ссылке. Превращаются в обычное право доступа.',
  },
  fields: [
    {
      name: 'code',
      label: 'Код',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Заполнится сам, если оставить пустым. Можно задать своё слово для рекламы.',
      },
    },
    {
      name: 'playlist',
      label: 'Плейлист',
      type: 'relationship',
      relationTo: 'playlists',
      required: true,
    },
    {
      /**
       * Нужен ли вход, чтобы код сработал.
       *
       * @remarks
       * По умолчанию да: это платный сценарий, и он должен быть безопасным
       * без дополнительных действий владельца.
       */
      name: 'requiresSignIn',
      label: 'Требовать вход',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'С входом доступ закрепляется за человеком: его видно в списке и можно отозвать. Без входа доступ живёт в браузере — отозвать адресно нельзя, а код, разойдясь по чатам, откроет плейлист всем.',
      },
    },
    {
      name: 'maxUses',
      label: 'Сколько раз сработает',
      type: 'number',
      min: 1,
      admin: {
        description: 'Пусто — без ограничения. Для кода без входа заполняется обязательно.',
      },
    },
    {
      name: 'usedCount',
      label: 'Уже сработал раз',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'expiresAt',
      label: 'Действует до',
      type: 'date',
      admin: {
        description: 'Пусто — бессрочно. Для кода без входа заполняется обязательно.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
      },
    },
    {
      /**
       * Сколько живёт доступ, выданный этим кодом.
       *
       * @remarks
       * Отличается от срока самого кода: код может работать месяц, а каждый
       * выданный по нему доступ — неделю. Так устроены подарки «посмотреть
       * до конца недели».
       */
      name: 'grantDays',
      label: 'На сколько дней открывает',
      type: 'number',
      min: 1,
      admin: { description: 'Пусто — навсегда.' },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;
        if (!data['code']) data['code'] = generateShortCode();

        // Код без входа обязан быть ограничен: он живёт в браузере, отозвать
        // его адресно нельзя, и без срока с лимитом он открывает плейлист
        // навсегда и всем, кто его перешлёт.
        if (data['requiresSignIn'] === false) {
          if (!data['maxUses']) data['maxUses'] = 50;
          if (!data['expiresAt']) {
            const month = new Date();
            month.setMonth(month.getMonth() + 1);
            data['expiresAt'] = month.toISOString();
          }
        }
        return data;
      },
    ],
  },
  access: {
    // Читать коды может только тот, кто их выдаёт: список кодов — это список
    // ключей от закрытого.
    read: ({ req: { user } }) => Boolean(user),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
};
