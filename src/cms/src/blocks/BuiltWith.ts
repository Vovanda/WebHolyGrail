import type { Block } from 'payload';

/**
 * BuiltWith — секция «реальные сайты на этом стеке».
 *
 * @deprecated Дублирует `feature-grid` с раскладкой «карусель»: та же карточка,
 * превью и ссылка, только поля названы под один домен (siteName/url/niche).
 * Новые страницы собираем на `feature-grid`. Блок остаётся, пока на нём живут
 * страницы прода; переедут — удаляем вместе с таблицей отдельной миграцией.
 *
 * Tip для админа: показывает живые production-инстансы для credibility.
 * Каждая карточка — имя сайта + URL + ниша + опциональный preview-скриншот.
 */
export const BuiltWithBlock: Block = {
  slug: 'built-with',
  labels: { singular: 'Реальные сайты на стеке (устаревший)', plural: 'Списки сайтов' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок секции',
      type: 'text',
      defaultValue: 'Сайты, которые уже работают',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (опционально)',
      type: 'text',
      defaultValue: 'Реальные production-инстансы на этом стеке.',
    },
    {
      name: 'items',
      label: 'Сайты',
      type: 'array',
      minRows: 1,
      maxRows: 12,
      admin: {
        description:
          'Карточка сайта: имя, адрес, пояснение и снимок главной. Пояснение берётся из описания самого сайта, чтобы не расходиться с ним.',
      },
      fields: [
        { name: 'siteName', label: 'Имя сайта', type: 'text', required: true },
        { name: 'url', label: 'Адрес сайта', type: 'text', required: true },
        {
          name: 'niche',
          label: 'Чем занимается',
          type: 'textarea',
          admin: { description: 'Берётся из описания сайта в его разметке.' },
        },
        {
          name: 'screenshot',
          label: 'Снимок для светлой темы',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'screenshotDark',
          label: 'Снимок для тёмной темы',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Без него в тёмной теме показывается светлый снимок: он выбивается ярким пятном.',
          },
        },
      ],
    },
  ],
};
