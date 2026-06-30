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
      defaultValue: 'Web Holy Grail',
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
          name: 'hours',
          label: 'Часы работы',
          type: 'text',
          admin: { description: 'Например: ПН–ВС 11:00–22:00' },
        },
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
            { label: 'X (Twitter)', value: 'x' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Одноклассники', value: 'ok' },
            { label: 'Дзен', value: 'dzen' },
            { label: 'Rutube', value: 'rutube' },
            { label: 'Pinterest', value: 'pinterest' },
            { label: 'GitHub', value: 'github' },
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
          defaultValue: true,
          admin: {
            description:
              'Если включено — посетитель может сам переключить тему, выбор запоминается в браузере.',
          },
        },
        {
          name: 'palettePreset',
          label: 'Готовая палитра (preset)',
          type: 'select',
          defaultValue: 'whg-default',
          options: [
            { label: 'Web Holy Grail (default)', value: 'whg-default' },
            { label: 'Linear', value: 'linear' },
            { label: 'Vercel', value: 'vercel' },
            { label: 'GitHub', value: 'github' },
            { label: 'Stripe', value: 'stripe' },
            { label: 'Custom (только из полей ниже)', value: 'custom' },
          ],
          admin: {
            description:
              'Выбор preset автоматически заполнит 16 hex-полей ниже значениями из набора. Можешь дальше править вручную — это override поверх preset.',
            components: {
              Field: '/admin/components/PalettePresetField',
            },
          },
        },
        {
          type: 'tabs',
          tabs: [
            {
              label: '☀ Светлая',
              fields: [
                {
                  name: 'paletteLight',
                  type: 'group',
                  label: '',
                  admin: { description: '8 цветов. Пусто — preset из dropdown выше.' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'primary',
                          label: 'Primary',
                          type: 'text',
                          admin: {
                            placeholder: '#2563eb',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'primaryHover',
                          label: 'Primary hover',
                          type: 'text',
                          admin: {
                            placeholder: '#1d4ed8',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'foreground',
                          label: 'Foreground (текст)',
                          type: 'text',
                          admin: {
                            placeholder: '#0a0a0a',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'foregroundMuted',
                          label: 'Foreground muted',
                          type: 'text',
                          admin: {
                            placeholder: '#737373',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'background',
                          label: 'Background',
                          type: 'text',
                          admin: {
                            placeholder: '#ffffff',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'surface',
                          label: 'Surface (карточки)',
                          type: 'text',
                          admin: {
                            placeholder: '#f5f5f5',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'success',
                          label: 'Success (✓)',
                          type: 'text',
                          admin: {
                            placeholder: '#16a34a',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'danger',
                          label: 'Danger (✗)',
                          type: 'text',
                          admin: {
                            placeholder: '#dc2626',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              label: '🌙 Тёмная',
              fields: [
                {
                  name: 'paletteDark',
                  type: 'group',
                  label: '',
                  admin: { description: '8 цветов для dark theme. Пусто — preset.' },
                  fields: [
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'primary',
                          label: 'Primary',
                          type: 'text',
                          admin: {
                            placeholder: '#3b82f6',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'primaryHover',
                          label: 'Primary hover',
                          type: 'text',
                          admin: {
                            placeholder: '#60a5fa',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'foreground',
                          label: 'Foreground',
                          type: 'text',
                          admin: {
                            placeholder: '#fafafa',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'foregroundMuted',
                          label: 'Foreground muted',
                          type: 'text',
                          admin: {
                            placeholder: '#a3a3a3',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'background',
                          label: 'Background',
                          type: 'text',
                          admin: {
                            placeholder: '#0f0f0f',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'surface',
                          label: 'Surface',
                          type: 'text',
                          admin: {
                            placeholder: '#171717',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'success',
                          label: 'Success',
                          type: 'text',
                          admin: {
                            placeholder: '#22c55e',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                        {
                          name: 'danger',
                          label: 'Danger',
                          type: 'text',
                          admin: {
                            placeholder: '#ef4444',
                            width: '50%',
                            components: { Field: '/admin/components/ColorField' },
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'layout',
      label: 'Layout (композиция панелей)',
      type: 'json',
      admin: {
        description:
          'JSON-конфигурация панелей по слотам. Пусто — используется дефолт из кода. ' +
          'Чтобы скрыть блок — удалить из массива panels или поставить "visibility": "hidden". ' +
          'Кнопка «Reset to default» копирует CLASSIC_SITE_LAYOUT в поле.',
        components: {
          Field: '/admin/components/LayoutJsonField',
        },
      },
    },
    {
      name: 'blog',
      label: 'Блог',
      type: 'group',
      admin: {
        description:
          'Глобальные настройки блога. Per-article override доступен через Article.displayOverrides.',
      },
      fields: [
        { name: 'showAuthor', label: 'Показывать автора', type: 'checkbox', defaultValue: true },
        {
          name: 'showDate',
          label: 'Показывать дату публикации',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'showReadingTime',
          label: 'Показывать время чтения',
          type: 'checkbox',
          defaultValue: true,
        },
        { name: 'showTags', label: 'Показывать теги', type: 'checkbox', defaultValue: true },
        {
          name: 'postsPerPage',
          label: 'Постов на странице',
          type: 'number',
          defaultValue: 10,
          min: 1,
          max: 100,
        },
        {
          name: 'defaultSort',
          label: 'Сортировка по умолчанию',
          type: 'select',
          options: [
            { label: 'Сначала новые', value: 'newest' },
            { label: 'Сначала старые', value: 'oldest' },
          ],
          defaultValue: 'newest',
        },
      ],
    },
  ],
  access: {
    read: () => true, // публичные настройки сайта читаются всеми.
    update: ({ req: { user } }) => Boolean(user),
  },
};
