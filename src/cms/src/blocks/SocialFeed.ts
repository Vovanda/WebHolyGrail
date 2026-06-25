import type { Block } from 'payload';

/**
 * SocialFeed — лента из соц-сетей на странице (R5++).
 *
 * @remarks
 * Generic под VK / Telegram / IG. Источник управляется полем `sources[]`.
 * Сами посты лежат в коллекции `Posts` (заполняется через `pnpm sync:vk-posts`).
 *
 * Конфигурация на 3 уровнях:
 *  1. ENV (`VEO_VK_GROUP_ID`, `VEO_VK_SVC_TOKEN`) — секреты, источник
 *  2. CMS-поля этого блока (фильтры, count, что показывать) — UI
 *  3. Per-post флаги в коллекции Posts (скрыть из ленты вручную — TODO)
 */
export const SocialFeedBlock: Block = {
  slug: 'social-feed',
  labels: { singular: 'Лента соц-сетей', plural: 'Ленты соц-сетей' },
  fields: [
    {
      name: 'sources',
      label: 'Источники',
      type: 'select',
      hasMany: true,
      defaultValue: ['vk'],
      options: [
        { label: 'VK', value: 'vk' },
        { label: 'Telegram', value: 'tg' },
        { label: 'Instagram', value: 'ig' },
      ],
      admin: {
        description:
          'Сейчас работает только VK. Telegram и Instagram — F-этап (нужны адаптеры в cms/lib/social/).',
      },
    },
    {
      name: 'count',
      label: 'Постов на странице',
      type: 'number',
      defaultValue: 30,
      min: 1,
      max: 100,
    },
    {
      name: 'hideLatest',
      label: 'Скрыть N свежих постов',
      type: 'number',
      defaultValue: 2,
      admin: {
        description:
          'Retention в источник: 2 самых свежих не показываем здесь, чтобы подписчик в VK находил эксклюзив. Стандарт legacy.',
      },
    },
    {
      name: 'showFilters',
      label: 'Показать фильтр-чипы (Все / Неделя / Месяц)',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'weekTopN',
      label: 'Топ-N за неделю',
      type: 'number',
      defaultValue: 3,
      admin: {
        condition: (_data, siblingData) => (siblingData?.showFilters ?? true) !== false,
        description:
          'Сколько лучших постов за 7 дней показывать в фильтре «🏆 За неделю». По engagement (likes + comments + reposts).',
      },
    },
    {
      name: 'monthTopN',
      label: 'Топ-N за месяц',
      type: 'number',
      defaultValue: 10,
      admin: {
        condition: (_data, siblingData) => (siblingData?.showFilters ?? true) !== false,
        description: 'Сколько лучших постов за 30 дней. По engagement.',
      },
    },
    {
      name: 'hideTagRegex',
      label: 'Regex для скрытия постов по тегу',
      type: 'text',
      defaultValue: '#эксклюз',
      admin: {
        description:
          'JavaScript regex без слешей. Default — скрываем посты с #эксклюзив / #эксклюз. Регистр игнорируется автоматически.',
      },
    },
  ],
};
