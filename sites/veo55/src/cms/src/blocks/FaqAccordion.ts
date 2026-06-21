import type { Block } from 'payload';

/**
 * FAQ-аккордеон — блок-обёртка для рендера групп FAQ на странице.
 *
 * @remarks
 * **R5++ функциональное имя.** Подойдёт любому сайту.
 *
 * **Источник данных — Collection `faq-groups`.** Сам блок только обёртка с
 * заголовком/лидом/CTA. Если `groups` пуст — рендерится **все** опубликованные
 * группы по `order`. Если задан фильтр — только указанные.
 *
 * Так Ольга править вопросы в `faq-groups` (drag&drop, отдельная сущность),
 * а на странице держать тонкую обвязку — заголовок, лид, CTA.
 */
export const FaqAccordionBlock: Block = {
  slug: 'faq-accordion',
  labels: { singular: 'FAQ-аккордеон', plural: 'FAQ-аккордеоны' },
  fields: [
    {
      name: 'title',
      label: 'Заголовок (h1)',
      type: 'text',
      required: true,
      admin: { description: 'Например: «Что нужно знать будущим владельцам ВЕО?»' },
    },
    {
      name: 'titleEmoji',
      label: 'Emoji слева от заголовка',
      type: 'text',
      defaultValue: '🐾',
      admin: { description: 'Опционально. Один emoji.' },
    },
    {
      name: 'lead',
      label: 'Лид (одна строка курсивом)',
      type: 'textarea',
      admin: {
        description: 'Например: «Короткие ответы на самые частые вопросы…»',
      },
    },
    {
      name: 'showChips',
      label: 'Показывать чипсы быстрого перехода',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Чипсы-кнопки сверху с emoji + название группы для якорь-навигации.',
      },
    },
    {
      name: 'groups',
      label: 'Группы (если пусто — все опубликованные)',
      type: 'relationship',
      relationTo: 'faq-groups',
      hasMany: true,
      admin: {
        description:
          'Фильтр конкретных групп FAQ. Если оставить пустым — берутся все опубликованные группы по полю order.',
      },
    },
    {
      name: 'cta',
      label: 'CTA-блок снизу',
      type: 'group',
      admin: { description: 'Опциональный «не нашли ответ?» блок под аккордеоном.' },
      fields: [
        {
          name: 'text',
          label: 'Текст',
          type: 'text',
          admin: { description: 'Например: «Не нашли ответ на свой вопрос?»' },
        },
        {
          name: 'linkLabel',
          label: 'Подпись ссылки',
          type: 'text',
          admin: { description: 'Например: «✉ Написать нам в VK»' },
        },
        {
          name: 'linkHref',
          label: 'URL',
          type: 'text',
          admin: { description: 'Полный URL — https://vk.me/veoomsk' },
        },
      ],
    },
  ],
};
