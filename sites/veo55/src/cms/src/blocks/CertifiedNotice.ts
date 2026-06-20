import type { Block } from 'payload';

/**
 * CertifiedNotice — generic-блок «сертифицированного статуса с чек-листом».
 *
 * @remarks
 * R5++ функциональное имя — подходит для любого сертификата с критериями:
 * заводчик ставит «Отборное разведение РКФ» с пятью пунктами Приложения №7,
 * автосервис — «Авторизованный дилер X» с критериями,
 * кофейня — «Specialty Coffee Association certified» с шагами обжарки.
 *
 * Поля:
 *  - `kicker` — короткий маркер сверху («ОТБОРНОЕ РАЗВЕДЕНИЕ · Selected Breeding»)
 *  - `title` — заголовок («Высший статус РКФ»). Опционально, многие блоки kicker + body
 *  - `body` — основной текст (textarea, переносы строк сохраняются)
 *  - `criteriaTitle` — заголовок чек-листа («Требования Приложения №7 РКФ — все соблюдены»)
 *  - `criteria[].text` — пункт чек-листа (показывается с ✓)
 */
export const CertifiedNoticeBlock: Block = {
  slug: 'certified-notice',
  labels: {
    singular: 'Сертифицированный статус',
    plural: 'Сертифицированные статусы',
  },
  fields: [
    {
      name: 'kicker',
      type: 'text',
      label: 'Маркер сверху',
      admin: { description: 'Короткая шапка над заголовком' },
    },
    {
      name: 'title',
      type: 'text',
      label: 'Заголовок',
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Описание',
      admin: { description: 'Переносы строк сохраняются' },
    },
    {
      name: 'criteriaTitle',
      type: 'text',
      label: 'Заголовок чек-листа',
    },
    {
      name: 'criteria',
      type: 'array',
      label: 'Чек-лист',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
};
