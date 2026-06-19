import type { GlobalConfig } from 'payload';

/**
 * SiteSettings — глобальные настройки сайта. Синглтон.
 *
 * @remarks
 * Инвариант (см. memo `HolyGrail/38`). Контакты, лого, навигация, реквизиты —
 * то что одинаково для всех страниц. Не делать ничего из этого Page-уровневым.
 *
 * Соответствие contracts: `SiteSettings` / `ContactsInfo` / `SocialLink`.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: {
    group: 'Администрирование',
  },
  fields: [
    {
      name: 'siteName',
      label: 'Имя сайта',
      type: 'text',
      required: true,
      defaultValue: 'Питомник «Омская Дружина»',
    },
    {
      name: 'logo',
      label: 'Логотип',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'contacts',
      label: 'Контакты',
      type: 'group',
      fields: [
        {
          name: 'phone',
          label: 'Телефон',
          type: 'text',
          admin: { description: 'Формат E.164: +7912xxxxxxx (для clickable tel:)' },
        },
        { name: 'email', label: 'Email', type: 'email' },
        { name: 'address', label: 'Адрес', type: 'text' },
        {
          name: 'mapEmbedUrl',
          label: 'Карта (embed URL)',
          type: 'text',
          admin: { description: 'Yandex / Google Maps embed iframe src.' },
        },
      ],
    },
    {
      name: 'mainNav',
      label: 'Основное меню (header)',
      type: 'array',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      fields: [
        { name: 'href', label: 'Ссылка', type: 'text', required: true },
        { name: 'label', label: 'Подпись', type: 'text', required: true },
        { name: 'external', label: 'Открывать в новой вкладке', type: 'checkbox' },
      ],
    },
    {
      name: 'footerNav',
      label: 'Меню footer (если отличается)',
      type: 'array',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      admin: { description: 'Если пусто — в footer показывается mainNav.' },
      fields: [
        { name: 'href', label: 'Ссылка', type: 'text', required: true },
        { name: 'label', label: 'Подпись', type: 'text', required: true },
        { name: 'external', label: 'Открывать в новой вкладке', type: 'checkbox' },
      ],
    },
    {
      name: 'social',
      label: 'Соцсети',
      type: 'array',
      labels: { singular: 'Соцсеть', plural: 'Соцсети' },
      fields: [
        {
          name: 'platform',
          label: 'Платформа',
          type: 'select',
          required: true,
          options: [
            { label: 'ВКонтакте', value: 'vk' },
            { label: 'Telegram', value: 'telegram' },
            { label: 'WhatsApp', value: 'whatsapp' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Другое', value: 'other' },
          ],
        },
        { name: 'url', label: 'URL', type: 'text', required: true },
        { name: 'label', label: 'Подпись (если иконки нет)', type: 'text' },
      ],
    },
    {
      name: 'theme',
      label: 'Тема',
      type: 'group',
      admin: {
        description:
          'Светлая / тёмная / автоматическая. Меняется через CSS-переменные (см. tokens.css), компоненты не переписываются. ' +
          'TODO (holygrail-themepalette): добавить поля для редактирования самой палитры (color-picker для --color-bg, --color-accent, --color-ink, etc) — чтобы админ менял брендинг без правки кода. См. roadmap-tokens-editor в reference/.',
      },
      fields: [
        {
          name: 'mode',
          label: 'Стартовый режим',
          type: 'select',
          required: true,
          defaultValue: 'light',
          options: [
            { label: 'Светлая (всегда)', value: 'light' },
            { label: 'Тёмная (всегда)', value: 'dark' },
            { label: 'Автоматическая (по системе)', value: 'auto' },
          ],
        },
        {
          name: 'userToggle',
          label: 'Показывать кнопку переключения юзеру',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Если включено — посетитель может сам переключить тему, выбор запоминается в браузере.',
          },
        },
        {
          name: 'availableThemes',
          label: 'Доступные темы для переключения',
          type: 'select',
          hasMany: true,
          defaultValue: ['light', 'dark'],
          admin: {
            description: 'Список тем которые юзер может выбирать (если включён переключатель).',
            condition: (_, siblingData) => siblingData?.userToggle === true,
          },
          options: [
            { label: 'Светлая', value: 'light' },
            { label: 'Тёмная', value: 'dark' },
          ],
        },
      ],
    },
  ],
  access: {
    read: () => true, // публичные настройки сайта читаются всеми.
    update: ({ req: { user } }) => Boolean(user),
  },
};
