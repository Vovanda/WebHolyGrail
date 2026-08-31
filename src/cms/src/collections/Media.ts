import { APIError, type CollectionConfig } from 'payload';

import { generateShortCode } from '../lib/video/short-code';
import { ensureChannel } from '../lib/channel.js';

import { isDarkImage } from '../lib/image-luma';
import { renderPdfPreview } from '../lib/pdf-preview';

/**
 * Media — uploaded files (images and documents).
 *
 * @remarks
 * Storage is S3-compatible (any provider — AWS S3, Cloudflare R2, Backblaze B2,
 * MinIO, etc.) wired in `payload.config.ts` via `@payloadcms/storage-s3`. The
 * plugin automatically sets `disableLocalStorage: true` for the attached
 * collection, so `staticDir` is intentionally absent here (leaving it on would
 * make Payload also write a local copy and serve it via `/api/media/...`, which
 * would override the CDN URL).
 *
 * Derived image sizes are produced by sharp on upload. The variant names match
 * the keys of `MediaDoc.sizes` in `contracts`.
 */
/**
 * Папка, в которой лежат обложки видео.
 *
 * @remarks
 * По ней же они отсеиваются из списка медиа, поэтому значение общее с тем
 * местом, где обложка создаётся: разъехавшись, они снова засорят медиатеку.
 */
export const POSTER_PREFIX = 'previews';

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медиафайл', plural: 'Медиа' },
  admin: {
    useAsTitle: 'title',
    // Первой идёт колонка без своей ячейки, и это не вкус: именно первой колонке
    // Payload выдаёт обёртку - ссылку на запись в списке и кнопку выбора в окне
    // выбора. Своя ячейка подменяет обёртку целиком, и запись перестаёт
    // открываться, а файл - выбираться.
    // Кадр показывает сама миниатюра имени файла: адрес кадра лежит рядом
    // с записью, поэтому отдельная колонка превью больше не нужна.
    defaultColumns: ['filename', 'caption', 'mimeType', 'updatedAt'],
    group: 'Медиа',
    /**
     * Обложки видео не показываются в общем списке.
     *
     * @remarks
     * Они создаются сами при нарезке и лежат отдельными файлами, потому что
     * иначе их не на что сослаться. Но для человека это не контент: на каждый
     * загруженный видео в списке появлялась вторая строка, и медиатека
     * наполовину состояла из служебных кадров.
     *
     * Скрыты только из списка. Связь с видео, ссылка и сам файл на месте,
     * и по прямому адресу обложка открывается как обычно.
     *
     * Признаком служит отдельное поле, а не имя папки: папку человек может
     * поменять руками, и список тут же наполнился бы служебными кадрами.
     */
    baseListFilter: () => ({
      or: [{ derived: { equals: false } }, { derived: { exists: false } }],
    }),
  },
  upload: {
    // Видео наравне с картинками: обложка с видео на фоне и съёмка с объекта —
    // обычный контент, а владелец сайта не должен ради этого идти к разработчику
    // или заливать файл в чужое хранилище мимо админки.
    //
    // Производные размеры и перевод в webp применяются только к изображениям —
    // видео и PDF сохраняются как есть.
    // Предельный размер файла задаётся не здесь, а в nginx
    // (`client_max_body_size` в `deploy/prod/nginx/`): загрузка упирается в
    // прокси раньше, чем доходит до приложения.
    mimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 768, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
    ],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
  },
  fields: [
    {
      /**
       * Имя документа в интерфейсе.
       *
       * @remarks
       * Заголовок карточки, крошки и подписи в выпадающих списках Payload
       * берёт из одного поля. Раньше это было имя файла, и человек видел
       * `lesson-4.mp4` там, где ожидал название видео.
       *
       * Заполняется само: название, а если его нет — имя файла, поэтому
       * у картинок и документов ничего не меняется. Руками не правится,
       * чтобы не разъезжалось с названием.
       */
      name: 'title',
      type: 'text',
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    {
      /**
       * Тёмная ли картинка.
       *
       * @remarks
       * По ней выбирается цвет текста поверх обложки: на светлой он тёмный,
       * на тёмной белый. Считается один раз при загрузке - тянуть файл из
       * хранилища на каждый показ страницы дороже самой страницы.
       *
       * Пусто у видео и документов, а также если файл не удалось разобрать.
       */
      name: 'isDark',
      type: 'checkbox',
      index: false,
      admin: { hidden: true, readOnly: true },
    },
    {
      /**
       * Файл создан системой, а не загружен человеком.
       *
       * @remarks
       * Такие файлы — обложки видео — существуют отдельными видео только
       * потому, что на них нужно ссылаться. Для владельца сайта это не контент,
       * а свойство видео, поэтому в медиатеке они не показываются.
       */
      name: 'derived',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'alt',
      label: 'Описание (alt)',
      type: 'text',
      // Не `required`, а проверка по типу файла: у видео и документов alt-текста
      // нет, и требовать его — заставлять человека выдумывать строку, лишь бы
      // форма сохранилась.
      validate: (value: unknown, { data }: { data?: { mimeType?: string } }) => {
        const mime = data?.mimeType ?? '';
        if (mime.startsWith('image/') && !String(value ?? '').trim()) {
          return 'Опишите, что на изображении — это читают скринридеры и поисковики.';
        }
        return true;
      },
      admin: {
        description:
          'Что изображено. Читают скринридеры и поисковики. Для видео и документов можно оставить пустым.',
      },
    },
    {
      name: 'preview',
      label: 'Превью',
      type: 'upload',
      relationTo: 'media',
      admin: {
        readOnly: true,
        description:
          'Для PDF собирается само из первой страницы при загрузке. Заполнять вручную не нужно.',
      },
    },
    {
      /**
       * Адрес кадра, который показывается вместо самого файла.
       *
       * @remarks
       * Кадр лежит отдельной записью, и связь на него хранит только номер.
       * Список Payload грузит записи без вложенности, причём глубина нуля
       * задана в самом списке, а не настройкой, - значит по связи адрес там
       * не достать ни сейчас, ни после подъёма версии. Поэтому адрес лежит
       * рядом с записью, и миниатюру рисует сам Payload всюду, где умеет:
       * в списке, в окне выбора, в поле выбора файла и в карточке.
       *
       * Заполняется там же, где ставится сам кадр, и руками не правится.
       */
      name: 'previewUrl',
      type: 'text',
      admin: { hidden: true, readOnly: true },
    },
    {
      // The field name `prefix` is the convention of `@payloadcms/storage-s3` (it
      // reads the field with exactly that slug, no extra setup needed).
      name: 'prefix',
      label: 'Папка в хранилище',
      type: 'text',
      /**
       * По умолчанию пусто, то есть файл лежит в корне бакета.
       *
       * @remarks
       * Раньше здесь стояло `media`, и адрес получался с удвоением:
       * публичный корень хранилища уже заканчивается на `/media`, а к ключу
       * добавлялась папка с тем же именем — выходило `/media/media/файл`.
       *
       * Разложить по папкам по-прежнему можно, вписав своё имя; служебные
       * обложки видео так и живут в собственной папке.
       */
      defaultValue: '',
      admin: {
        description: 'Пусто — файл лежит в корне хранилища. Имя папки задаётся вручную.',
        position: 'sidebar',
      },
    },
    {
      name: 'caption',
      label: 'Название',
      type: 'text',
      /**
       * У видео название обязательно.
       *
       * @remarks
       * Страница видео идёт в поисковую выдачу и в превью мессенджера, и имя
       * файла там выглядит как недоделанный сайт. У картинок и документов
       * подпись по-прежнему необязательна.
       */
      validate: (value: unknown, { data }: { data?: { mimeType?: string } }) => {
        const mime = data?.mimeType ?? '';
        if (mime.startsWith('video/') && !String(value ?? '').trim()) {
          return 'Название видно на странице видео и в поиске — имя файла там не годится.';
        }
        return true;
      },
      admin: {
        description: 'Для видео обязательно: показывается на странице видео и в поисковой выдаче.',
      },
    },
    {
      /**
       * Описание записи: то, что читает зритель под кадром.
       *
       * @remarks
       * Раньше его роль играл `alt` - поле, заведённое для картинок и
       * скринридеров. У видео это разные вещи: alt описывает изображение
       * тому, кто его не видит, а описание рассказывает, о чём запись.
       */
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      admin: {
        description: 'Показывается под кадром и в поисковой выдаче. Для картинок не нужно.',
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
      },
    },
    {
      // Показывает обложку и состояние нарезки вместо штатного превью: после
      // нарезки исходник удаляется, и Payload рисует крестик — человек читает
      // это как «видео пропало» и идёт перезаливать.
      name: 'videoPreview',
      type: 'ui',
      admin: {
        components: {
          Field: '/admin/components/VideoPreviewField#VideoPreviewField',
        },
      },
    },
    {
      // Возврат помеченного к удалению. Стоит рядом с превью, а не в служебной
      // группе: это единственное действие среди её полей, а сама группа скрыта.
      name: 'videoRestore',
      type: 'ui',
      admin: {
        components: {
          Field: '/admin/components/RestoreVideoField#RestoreVideoField',
        },
      },
    },
    {
      /**
       * Короткий адрес видео: `/@автор/v/<код>`.
       *
       * @remarks
       * Номер медиафайла в адрес не годится — по нему видео перебираются
       * подряд, и закрытые обнаруживаются простым увеличением числа. Заодно
       * номер выдаёт, сколько всего загружено.
       *
       * Код выдаётся один раз и не меняется: ссылка расходится по мессенджерам
       * и поисковой выдаче, переезд адреса её обнулит.
       */
      name: 'shortCode',
      label: 'Код в адресе',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
      },
    },
    {
      /**
       * Кто залил файл.
       *
       * @remarks
       * Это факт, а не право: заполняется само из текущего пользователя и
       * руками не меняется. Права даёт роль — отдельно.
       *
       * Нужно для канала (`/@автор`), для области хранения и для того, чтобы
       * каждый участник видел статистику только по своему. Проставляется
       * сразу, а не «когда понадобится»: расставлять авторство задним числом
       * по накопившемуся архиву будет нечем.
       */
      name: 'uploadedBy',
      label: 'Загрузил',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      /**
       * Кому выдаётся ключ.
       *
       * @remarks
       * По умолчанию закрыто, и это не осторожность ради осторожности. Раньше
       * значением по умолчанию было «всем»: платная запись открывалась любому
       * с того мгновения, как дорезалась, и до того, как автор вспомнит
       * переключить. Окном пользуется тот, кто первым обновит страницу канала.
       *
       * Обратное неверно: лишний раз открыть запись дёшево и обратимо, а
       * утёкшую уже не закрыть - её успели скачать.
       *
       * У записей, залитых раньше, значение уже стоит в базе, и оно не меняется:
       * открытое остаётся открытым.
       */
      name: 'access',
      label: 'Доступ',
      type: 'select',
      defaultValue: 'private',
      options: [
        { label: 'Открытое', value: 'public' },
        { label: 'Закрытое', value: 'private' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description:
          'Закрытое отпирается кодом или правом на подборку. Новое видео закрыто, пока не открыли. Переключается в любой момент, перенарезка не нужна.',
      },
    },
    {
      /**
       * Попадает ли запись в списки.
       *
       * @remarks
       * Ось, независимая от доступа, и это не тонкость: без неё витрина
       * собиралась сама из всего залитого, а платная запись успевала побывать
       * на виду в промежутке между нарезкой и переключением доступа.
       *
       * Все четыре сочетания осмысленны. Закрытое опубликованное - витрина
       * платного: видно, что есть, замок объясняет, почему не играет. Открытое
       * скрытое - то, что раздают ссылкой, минуя списки. Скрытое закрытое -
       * заготовка. Открытое опубликованное - обычная запись.
       *
       * Скрыто по умолчанию: показ - решение автора, а не следствие загрузки.
       */
      name: 'visibility',
      label: 'Публикация',
      type: 'select',
      defaultValue: 'hidden',
      options: [
        { label: 'Опубликовано', value: 'published' },
        { label: 'Скрыто', value: 'hidden' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description:
          'Видно ли запись в списках канала. Доступа не касается: закрытое остаётся закрытым и опубликованным.',
      },
    },
    {
      name: 'chapters',
      label: 'Главы',
      type: 'array',
      maxRows: 60,
      admin: {
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description:
          'Оглавление видео: с какой секунды начинается кусок и как он называется. Полоса времени делится на части, и до нужного места доходят одним нажатием.',
      },
      fields: [
        {
          name: 'startSeconds',
          label: 'Начало, секунды',
          type: 'number',
          required: true,
          min: 0,
          admin: { description: 'Например 125 - это 2:05.' },
        },
        {
          name: 'title',
          label: 'Название',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'subtitles',
      label: 'Субтитры',
      type: 'array',
      maxRows: 12,
      admin: {
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description:
          'Отдельные файлы рядом с видео. Добавляются и меняются когда угодно: перенарезка не нужна.',
      },
      fields: [
        {
          name: 'language',
          label: 'Язык',
          type: 'text',
          required: true,
          admin: { description: 'Код языка: ru, en, de. По нему браузер понимает дорожку.' },
        },
        {
          name: 'label',
          label: 'Как показывать в плеере',
          type: 'text',
          required: true,
          admin: { description: 'Например «Русские» или «English».' },
        },
        {
          name: 'file',
          label: 'Файл дорожки',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: { description: 'Формат VTT.' },
        },
        {
          name: 'default',
          label: 'Включать сразу',
          type: 'checkbox',
          defaultValue: false,
          admin: { description: 'Дорожка включится у тех, кто ничего не выбирал сам.' },
        },
      ],
    },
    {
      name: 'hls',
      label: 'Потоковое видео',
      type: 'group',
      /**
       * Из формы группа скрыта целиком.
       *
       * @remarks
       * Все её поля заполняются нарезкой и доступны только для чтения, то есть
       * повлиять на них нельзя ничем. При этом заголовок с пояснением занимал
       * пол-карточки, а состояние, качества и длительность и так показаны
       * строкой под кадром.
       *
       * Данные никуда не делись: их читают эндпоинты и плеер, а единственное
       * действие — возврат удалённого видео — вынесено кнопкой к превью.
       */
      admin: {
        hidden: true,
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
      },
      fields: [
        {
          name: 'progressView',
          type: 'ui',
          admin: {
            components: {
              Field: '/admin/components/VideoProgressField#VideoProgressField',
            },
          },
        },
        {
          name: 'status',
          label: 'Состояние',
          type: 'select',
          defaultValue: 'pending',
          options: [
            { label: 'В очереди', value: 'pending' },
            { label: 'Нарезается', value: 'processing' },
            { label: 'Готово', value: 'ready' },
            { label: 'Ошибка', value: 'failed' },
          ],
          admin: { readOnly: true },
        },
        {
          name: 'playlistUrl',
          label: 'Манифест потока',
          type: 'text',
          // Технический адрес `master.m3u8`: человеку он ничего не говорит,
          // а плеер берёт его сам.
          admin: { readOnly: true, hidden: true },
        },
        {
          // Хранится отдельно от адреса манифеста: у закрытого видео это
          // случайный UUID, и по номеру медиафайла его уже не вычислить, а
          // чистить прошлую нарезку при перезаливке по чему-то надо.
          name: 'prefix',
          label: 'Папка в хранилище',
          type: 'text',
          admin: { readOnly: true, hidden: true },
        },
        {
          name: 'progress',
          label: 'Готово, %',
          type: 'number',
          min: 0,
          max: 100,
          // Заполняется обработкой по ходу нарезки: без вестей карточка
          // выглядит зависшей, и владелец не понимает, идёт работа или встала.
          admin: { readOnly: true, hidden: true },
        },
        {
          name: 'storyboard',
          label: 'Кадры для перемотки',
          type: 'group',
          // Заполняется обработкой: полоса времени показывает кадр под курсором,
          // и перемотка перестаёт быть вслепую.
          admin: { readOnly: true, hidden: true },
          fields: [
            { name: 'url', type: 'text' },
            { name: 'columns', type: 'number' },
            { name: 'rows', type: 'number' },
            { name: 'count', type: 'number' },
            { name: 'frameWidth', type: 'number' },
            { name: 'frameHeight', type: 'number' },
            { name: 'intervalSeconds', type: 'number' },
          ],
        },
        {
          /**
           * Сколько весит нарезка целиком.
           *
           * @remarks
           * Считается при разрезании по всем выданным кускам. Показывается
           * вместо веса исходника: тот удаляется, и подпись под именем обещала
           * файл, которого в хранилище нет.
           *
           * Пусто у записей, нарезанных до появления этого поля; тогда
           * показывается прежний вес с оговоркой, что он от исходника.
           */
          name: 'packBytes',
          label: 'Вес нарезки',
          type: 'number',
          admin: { readOnly: true },
        },
        {
          name: 'qualities',
          label: 'Качества',
          type: 'array',
          // Показаны строкой в карточке видео. Здесь это массив, где значение
          // спрятано за раскрытием: чтобы увидеть «480p», нужно развернуть
          // «Quality 01» — на каждое качество по нажатию.
          admin: { readOnly: true, hidden: true },
          fields: [{ name: 'height', type: 'number' }],
        },
        {
          name: 'durationSeconds',
          label: 'Длительность, с',
          type: 'number',
          // Показана в карточке видео рядом с качествами.
          admin: { readOnly: true, hidden: true },
        },
        {
          /**
           * Шаг криптопериодовы: сколько частей идёт под одним ключом.
           *
           * @remarks
           * Ключей у записи не один: каждая криптопериодова шифруется своим, выведенным из
           * секрета записи и номера криптопериодовы. Самих ключей здесь нет — их незачем
           * хранить, вывод односторонний и повторяемый.
           *
           * Шаг лежит у записи, а не берётся из настройки при выдаче. Настройка
           * меняется владельцем когда угодно, и выдача, поделившая номер части
           * на новое значение, посчитала бы не ту криптопериодову — беззвучно перестала бы
           * играть вся уже нарезанная база.
           *
           * Пусто — запись нарезана до этой перемены, у неё единственный ключ
           * в поле рядом, и перезаливать её нельзя (R10).
           */
          name: 'cryptoPeriod',
          label: 'Сегментов под одним ключом',
          type: 'number',
          admin: { readOnly: true },
        },
        {
          // Секрет держим в базе, а не в хранилище: иначе он лежал бы рядом
          // с сегментами и шифрование не защищало бы ни от чего.
          name: 'secret',
          label: 'Секрет потока',
          type: 'text',
          admin: { readOnly: true, hidden: true },
          access: {
            // Секрет не приезжает в выдачу API вместе с документом — за ним
            // ходят в отдельный эндпоинт, который решает, кому можно. Здесь
            // его не видит никто, включая администратора.
            read: () => false,
          },
        },
        {
          // Кнопка возврата рядом с пометкой: срок отсрочки бессмыслен, если
          // вернуть видео можно только запросом в базу.
          name: 'restore',
          type: 'ui',
          admin: {
            components: {
              Field: '/admin/components/RestoreVideoField#RestoreVideoField',
            },
          },
        },
        {
          /**
           * Пометка удаления.
           *
           * @remarks
           * Видео пропадает с сайта сразу, а файлы стираются отложенно: удаление —
           * единственное необратимое действие, потому что оригинала уже нет.
           * Отсрочка превращает «нажал не туда» из катастрофы в мелочь.
           */
          name: 'deletedAt',
          label: 'Помечен к удалению',
          type: 'date',
          admin: {
            readOnly: true,
            description: 'Видео скрыто с сайта. Файлы будут стёрты по истечении срока из настроек.',
          },
        },
        {
          name: 'error',
          label: 'Причина ошибки',
          type: 'textarea',
          admin: {
            readOnly: true,
            condition: (_data, siblingData) => siblingData?.status === 'failed',
          },
        },
      ],
    },
  ],
  access: {
    read: () => true, // Публичный URL для медиа — без авторизации.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    /**
     * Проставляет автора при загрузке.
     *
     * @remarks
     * Только при создании: у существующего файла автор не меняется, даже если
     * видео правит кто-то другой. Иначе первая же правка чужой подписи
     * переписала бы историю загрузок.
     */
    beforeChange: [
      /*
        Яркость картинки считается по загруженному файлу, пока он ещё в руках:
        после сохранения он уходит в хранилище, и достать его обратно можно
        только запросом по сети.
      */
      async ({ data, req }) => {
        const upload = req.file;
        if (upload?.data && String(upload.mimetype ?? '').startsWith('image/')) {
          data['isDark'] = await isDarkImage(upload.data);
        }
        return data;
      },
      async ({ data, req, operation }) => {
        if (operation === 'create' && req.user && !data['uploadedBy']) {
          data['uploadedBy'] = req.user.id;
        }

        /*
          Залитое видео само заводит автору канал, если у того адреса ещё нет.

          Адрес проставлялся только при заведении учётной записи, а те, что
          старше самого поля, остались без него. Владелец заливал запись,
          отмечал её общедоступной, открывал канал - и получал «страница не
          найдена», потому что канала с таким адресом не существовало.

          Адрес берётся у самого автора записи, а не у того, кто нажал
          «сохранить»: запись могли залить за него.
        */
        if (operation === 'create' && String(data['mimeType'] ?? '').startsWith('video/')) {
          const автор = data['uploadedBy'];
          const номер = typeof автор === 'object' && автор ? (автор as { id?: unknown }).id : автор;
          if (номер !== undefined && номер !== null && номер !== '') {
            await ensureChannel(req, номер as string | number).catch(() => undefined);
          }
        }
        // Код выдаём только видео и только один раз: у остальных файлов
        // своей страницы нет, а у существующего видео адрес не меняется.
        if (
          operation === 'create' &&
          !data['shortCode'] &&
          String(data['mimeType'] ?? '').startsWith('video/')
        ) {
          data['shortCode'] = generateShortCode();
        }

        // Имя документа держим в актуальном виде: название могли только что
        // поменять, а имя файла — единственное, что есть у картинок.
        const caption = String(data['caption'] ?? '').trim();
        const filename = String(data['filename'] ?? '').trim();
        if (caption || filename) data['title'] = caption || filename;

        return data;
      },
    ],

    /**
     * Удаление видео — пометка, а не стирание.
     *
     * @remarks
     * Оригинал стёрт сразу после нарезки, восстановить видео неоткуда. Поэтому
     * «удалить» означает скрыть: с сайта он пропадает немедленно, а файлы лежат
     * до срока из настроек и уходят отдельной задачей.
     *
     * Картинок и документов это не касается — они удаляются как раньше.
     */
    beforeDelete: [
      async ({ id, req, context }) => {
        // Уборщик стирает по истечении срока — ему перехват не нужен.
        if (context?.['skipDeleteGuard']) return;
        const doc = (await req.payload.findByID({
          collection: 'media',
          id,
          depth: 0,
          overrideAccess: true,
        })) as { mimeType?: string; hls?: { deletedAt?: string | null } };

        if (!String(doc?.mimeType ?? '').startsWith('video/')) return;
        // Уже помечен — значит стирает задача уборки, ей мешать не нужно.
        if (doc?.hls?.deletedAt) return;

        await req.payload.update({
          collection: 'media',
          id,
          data: { hls: { deletedAt: new Date().toISOString() } },
          context: { skipHlsQueue: true },
        });

        // APIError, а не обычная ошибка: иначе Payload отвечает «Something went
        // wrong», и человек не понимает, удалилось вообще или нет.
        throw new APIError(
          'Видео скрыт с сайта. Файлы будут стёрты автоматически по истечении срока из настроек — до тех пор его можно вернуть.',
          400,
        );
      },
    ],

    /**
     * Cache-busting via `?v=<updatedAt>` appended to the public URL.
     *
     * Problem: many CDNs keep objects with a long TTL keyed by Etag. If the file
     * at S3 is replaced under the same key (re-uploaded through the admin with
     * the same filename, or written directly to the bucket out-of-band), the CDN
     * edge keeps serving the old copy from its cache.
     *
     * This hook appends `?v=<timestamp>` to `url` and to each `sizes.*.url`. Any
     * update of the Media record in Payload bumps `updatedAt` → the query string
     * changes → the CDN edge fetches the fresh file from S3 (the query string is
     * part of the cache key).
     *
     * Side-effect: if a file is replaced directly on S3 without saving the Media
     * record through the admin, busting will not trigger (`updatedAt` is
     * unchanged). In that case open the Media record in `/admin` and click Save
     * (touches `updatedAt`) so the CDN picks up the new version.
     */
    afterRead: [
      /**
       * Адрес манифеста для плеера - зеркальная ручка, а не раздача.
       *
       * @remarks
       * В манифесте стоит путь ключа без домена, и браузер разрешает его
       * от адреса самого манифеста: возьми плеер файл из раздачи - запрос
       * ключа уйдёт туда же, в хранилище.
       *
       * В базе адрес остаётся прежним: он верен и нужен тому, кто идёт
       * за файлом напрямую. Меняется только то, что отдаётся наружу.
       */
      ({ doc }) => {
        const hls = doc?.hls as { prefix?: string | null; playlistUrl?: string | null } | undefined;
        if (!hls?.prefix || !hls.playlistUrl) return doc;

        return {
          ...doc,
          hls: { ...hls, playlistUrl: `/internal/video/manifest/${String(doc.id)}` },
        };
      },
      /**
       * У нарезанного видео адресом становится его манифест потока.
       *
       * @remarks
       * Исходник удаляется сразу после успешной нарезки, а адрес в базе
       * оставался прежним — и любая ссылка на видео вела в «NoSuchKey»: и
       * плашка файла в админке, и «скопировать ссылку», и обращение по API.
       *
       * Манифест (`master.m3u8`) — оглавление кусков этого же видео, оно есть
       * у каждого нарезанного видео. К плейлистам видео отношения не имеет:
       * плейлист — это подборка, и её у видео может не быть вовсе.
       */
      ({ doc }) => {
        /*
          Миниатюрой служит снятый кадр. Адрес берётся из поля рядом с записью,
          а не из связи: в списке связь приходит номером, и по ней адреса нет.
          Развёрнутая связь остаётся запасным путём - для записей, у которых
          поле ещё не заполнено.
        */
        const preview = doc?.preview as { url?: string } | number | string | undefined;
        const posterUrl =
          (typeof doc?.previewUrl === 'string' && doc.previewUrl) ||
          (typeof preview === 'object' && preview !== null ? preview.url : undefined);

        const hls = doc?.hls as
          | {
              status?: string;
              playlistUrl?: string | null;
              prefix?: string | null;
              packBytes?: number | null;
            }
          | undefined;
        const streamUrl = hls?.status === 'ready' ? (hls.playlistUrl ?? undefined) : undefined;

        /*
          Имя показывается такое, как объект называется в хранилище. Исходника
          давно нет, а плашка обещала `lesson-4.mp4` и вела на манифест: человек
          нажимал в расчёте посмотреть видео и получал список кусков. Теперь имя
          и адрес говорят об одном и том же - о пакете нарезки. Смотрят видео
          не отсюда, а по ссылке на страницу в блоке предпросмотра ниже.
        */
        const packName = streamUrl && hls?.prefix ? `${hls.prefix}/master.m3u8` : undefined;

        /*
          Весом называется вес нарезки, а не исходника: исходник удалён, и его
          вес рядом с именем пакета сбивал с толку. Прежний вес не теряется -
          он уезжает в поле рядом и показывается в предпросмотре с оговоркой,
          что он от исходника. У записей, нарезанных до подсчёта, веса пакета
          нет, и подпись остаётся прежней.
        */
        const packBytes = streamUrl ? (hls?.packBytes ?? undefined) : undefined;
        const sourceFilesize = typeof doc?.filesize === 'number' ? doc.filesize : undefined;

        if (!posterUrl && !streamUrl) return doc;

        return {
          ...doc,
          ...(streamUrl ? { url: streamUrl } : {}),
          ...(packName ? { filename: packName } : {}),
          ...(posterUrl ? { thumbnailURL: posterUrl } : {}),
          ...(packBytes ? { filesize: packBytes, sourceFilesize: sourceFilesize ?? null } : {}),
        };
      },
      ({ doc }) => {
        if (!doc?.url) return doc;
        const v = doc.updatedAt ? new Date(doc.updatedAt as string | Date).getTime() : Date.now();
        const bust = (url: unknown): unknown => {
          if (typeof url !== 'string' || !url) return url;
          return url + (url.includes('?') ? '&' : '?') + `v=${v}`;
        };
        const sizes = doc.sizes as Record<string, { url?: unknown }> | undefined;
        return {
          ...doc,
          url: bust(doc.url),
          ...(sizes
            ? {
                sizes: Object.fromEntries(
                  Object.entries(sizes).map(([k, s]) => [k, { ...s, url: bust(s?.url) }]),
                ),
              }
            : {}),
        };
      },
    ],

    /**
     * Нарезка загруженного видео ставится в очередь сама.
     *
     * @remarks
     * От человека в админке не требуется ничего, кроме «выбрать файл»: кнопок
     * «подготовить видео» нет и быть не должно — про них забывают, и видео
     * молча остаётся неиграбельным.
     *
     * Ставится только на загрузку файла, а не на любое сохранение: правка
     * подписи или переключение доступа перенарезки не требуют. Признак —
     * наличие `req.file`; служебные обновления самой задачи помечены
     * `context.skipHlsQueue`, иначе видео результата запустила бы новый круг.
     */
    afterChange: [
      async ({ doc, req, context }) => {
        if (context?.['skipHlsQueue']) return doc;
        if (!req.file) return doc;
        if (!String(doc?.mimeType ?? '').startsWith('video/')) return doc;

        try {
          await req.payload.jobs.queue({
            task: 'build-hls',
            input: { mediaId: String(doc.id) },
          });
          await req.payload.update({
            collection: 'media',
            id: doc.id as string | number,
            data: { hls: { status: 'pending', error: null } },
            context: { skipHlsQueue: true },
          });
        } catch (error) {
          // Файл уже сохранён — ронять загрузку из-за очереди нельзя.
          // Нарезку можно запустить кнопкой в списке задач.
          req.payload.logger.error(
            `[media] не удалось поставить нарезку для ${doc.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
        return doc;
      },

      /**
       * Превью первой страницы для загруженного PDF.
       *
       * @remarks
       * Документы на сайте показываются плиткой с картинкой. Раньше её готовили
       * руками и заливали отдельным файлом: лишний шаг, о котором забывают, и
       * превью разъезжается с документом после его замены.
       *
       * Работает после создания, а не до: файл к этому моменту уже сохранён, и
       * сбой рендера не мешает загрузить сам документ. Превью кладём отдельным
       * медиафайлом и связываем — так оно попадает в то же хранилище и получает
       * тот же CDN-адрес, что и всё остальное.
       */
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc;
        if (doc?.mimeType !== 'application/pdf' || doc?.preview) return doc;

        const data = req.file?.data;
        if (!data) return doc;

        const preview = await renderPdfPreview(data as Buffer);
        if (!preview) return doc;

        try {
          const base = String(doc.filename ?? 'document').replace(/\.pdf$/i, '');
          const created = await req.payload.create({
            collection: 'media',
            data: {
              alt: `Первая страница документа «${base}»`,
              prefix: POSTER_PREFIX,
              derived: true,
            },
            file: {
              data: preview,
              name: `${base}-preview.webp`,
              mimetype: 'image/webp',
              size: preview.length,
            },
          });
          await req.payload.update({
            collection: 'media',
            id: doc.id as string | number,
            data: { preview: created.id, previewUrl: created.url ?? null },
          });
          return { ...doc, preview: created.id, previewUrl: created.url ?? null };
        } catch {
          // Документ уже сохранён — превью не критично, добавится при повторной загрузке.
          return doc;
        }
      },
    ],
  },
};
