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
/**
 * Дефолт имени сайта — нейтральный: схема generic и уезжает во все инстансы,
 * так что бренда движка тут быть не должно (#72). Реальное имя ставит
 * `seed:minimal` из `SITE_NAME`, дальше правится из админки.
 */
export const DEFAULT_SITE_NAME = 'Новый сайт';

/**
 * Пустая строка в поле-дате блокирует настройки целиком.
 *
 * @remarks
 * Payload прогоняет сохранённые даты через `new Date(...).toISOString()`. Пустая
 * строка даёт Invalid Date, и падает не только это поле, а всё сохранение
 * глобала — причём и в админке тоже. Значение при этом уже лежит в базе, так
 * что настройки перестают сохраняться навсегда, до правки в обход приложения.
 * Пустая дата — это отсутствие даты, поэтому приводим её к `null` на входе.
 */
const emptyDatesToNull = ({ data }: { data?: Record<string, unknown> }) => {
  const personalData = data?.['personalData'] as Record<string, unknown> | undefined;
  if (personalData && personalData['policyUpdatedAt'] === '') {
    personalData['policyUpdatedAt'] = null;
  }
  return data;
};

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Настройки сайта',
  admin: {
    group: 'Администрирование',
  },
  hooks: {
    beforeValidate: [emptyDatesToNull],
  },
  fields: [
    {
      name: 'siteName',
      label: 'Имя сайта',
      type: 'text',
      required: true,
      defaultValue: DEFAULT_SITE_NAME,
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
      name: 'personalData',
      label: 'Обработка персональных данных',
      type: 'group',
      admin: {
        description:
          'Реквизиты подставляются в текст политики вместо меток вида {{operatorName}}. Пока поле пустое, метка остаётся видимой, а над страницей висит пометка «черновик».',
      },
      fields: [
        {
          name: 'operatorName',
          label: 'Оператор — кто именно',
          type: 'text',
          admin: {
            description: 'ФИО полностью, ИП или название организации — как в документах.',
          },
        },
        { name: 'operatorInn', label: 'ИНН', type: 'text' },
        {
          name: 'operatorAddress',
          label: 'Адрес',
          type: 'text',
          admin: { description: 'Адрес, по которому оператор принимает обращения.' },
        },
        {
          name: 'contactEmail',
          label: 'Почта для обращений по данным',
          type: 'email',
          admin: { description: 'Сюда пишут с просьбой удалить данные или отозвать согласие.' },
        },
        {
          name: 'rknRegistryNumber',
          label: 'Номер записи в реестре операторов',
          type: 'text',
          admin: {
            description:
              'Приходит после подачи уведомления в Роскомнадзор через Госуслуги. Указывается в политике.',
          },
        },
        {
          name: 'rknNotified',
          label: 'Уведомление в Роскомнадзор подано',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Пока не отмечено, в админке висит напоминание. Уведомление подаёт оператор — это его обязанность, а не разработчика.',
          },
        },
        {
          name: 'policyUpdatedAt',
          label: 'Дата последней редакции политики',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } },
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
        {
          name: 'children',
          label: 'Подпункты',
          type: 'array',
          labels: { singular: 'Подпункт', plural: 'Подпункты' },
          admin: {
            description: 'Раскрываются под пунктом. Сам пункт остаётся ссылкой на раздел целиком.',
          },
          fields: [
            { name: 'href', label: 'Ссылка', type: 'text', required: true },
            { name: 'label', label: 'Подпись', type: 'text', required: true },
            { name: 'external', label: 'Открывать в новой вкладке', type: 'checkbox' },
          ],
        },
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
            { label: 'Ink & Gold (чёрно-золотая)', value: 'ink-gold' },
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
      name: 'video',
      label: 'Видео',
      type: 'group',
      admin: {
        description:
          'Во сколько качеств резать загруженное видео. Меняется без разработчика; уже нарезанные ролики не пересобираются.',
      },
      fields: [
        {
          name: 'playerUi',
          label: 'Вид плеера',
          type: 'select',
          defaultValue: 'vidstack',
          options: [
            { label: 'Обычный', value: 'vidstack' },
            { label: 'Прежний', value: 'chrome' },
          ],
          admin: {
            description:
              'Два слоя управления на одном движке. Меняется без выкладки; посмотреть второй, ничего не переключая, можно добавив к адресу ?player=chrome.',
          },
        },
        {
          name: 'denied',
          label: 'Вместо закрытой записи',
          type: 'group',
          admin: {
            description:
              'Что видит зритель, которому запись пока не открыта. Обложка остаётся на месте, поверх неё - текст и кнопка.',
          },
          fields: [
            {
              name: 'title',
              label: 'Текст',
              type: 'text',
              defaultValue: 'Откроется по коду доступа',
            },
            {
              name: 'note',
              label: 'Пояснение под текстом',
              type: 'text',
              admin: { description: 'Необязательно. Например, где взять код.' },
            },
            {
              name: 'actionLabel',
              label: 'Надпись на кнопке',
              type: 'text',
              admin: { description: 'Пусто - кнопки не будет.' },
            },
            {
              name: 'actionHref',
              label: 'Куда ведёт кнопка',
              type: 'text',
              admin: { description: 'Адрес страницы с покупкой, входом или условиями.' },
            },
            {
              name: 'notReadyTitle',
              label: 'Пока запись готовится',
              type: 'text',
              defaultValue: 'Видео ещё готовится к показу',
              admin: { description: 'Показывается, пока нарезка не закончилась.' },
            },
          ],
        },
        {
          name: 'codeLength',
          label: 'Длина кода доступа',
          type: 'select',
          defaultValue: '6',
          options: [
            { label: '6 символов', value: '6' },
            { label: '8 символов', value: '8' },
          ],
          admin: {
            description:
              'Код вводят руками и диктуют по телефону. Шести хватает, пока код живёт минуты; для долгих промокодов лучше восемь.',
          },
        },
        {
          name: 'codeTtlMinutes',
          label: 'Сколько минут живёт код',
          type: 'number',
          defaultValue: 5,
          min: 1,
          max: 43200,
          admin: {
            description:
              'Для персональной выдачи — минуты. Рекламному промокоду можно поставить недели.',
          },
        },
        {
          name: 'accessDays',
          label: 'На сколько дней открывает доступ',
          type: 'number',
          defaultValue: 30,
          min: 1,
          admin: {
            description:
              'Срок самого доступа после ввода кода. Не путать со сроком кода: код живёт минуты, доступ — месяцами.',
          },
        },
        {
          name: 'purgeAfterDays',
          label: 'Через сколько дней стирать удалённые ролики',
          type: 'number',
          defaultValue: 30,
          min: 1,
          max: 365,
          admin: {
            description:
              'Удалённый ролик сразу пропадает с сайта, а файлы лежат ещё столько дней — на случай, если удалили по ошибке.',
          },
        },
        {
          name: 'qualities',
          label: 'Качества',
          type: 'select',
          hasMany: true,
          defaultValue: ['480', '720'],
          options: [
            { label: '360p — совсем слабый интернет', value: '360' },
            { label: '480p', value: '480' },
            { label: '720p (HD)', value: '720' },
            { label: '1080p (Full HD)', value: '1080' },
          ],
          admin: {
            description:
              'Каждое качество — отдельный проход по ролику при нарезке и место в хранилище. Ступени выше исходника не создаются.',
          },
        },
      ],
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
