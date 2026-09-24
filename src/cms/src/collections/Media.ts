import type { CollectionConfig } from 'payload';
import { MEDIA_RENDITIONS } from 'contracts';

import { copiesOf, withoutCopy, type MediaRecord } from '../lib/media-copies';
import {
  bustCdnCache,
  dropMovedLeftovers,
  ensureAuthorChannel,
  exposeManifestRoute,
  exposeStreamPack,
  issueShortCode,
  makePdfPreview,
  measureImage,
  moveOnPrefixChange,
  normalizeUploadName,
  queueVideoCut,
  softDeleteVideo,
  stampUploader,
  syncPreviewUrl,
  syncTitle,
} from '../lib/media-hooks';
import { dropStoredFile } from '../lib/media-store';

/**
 * Медиатека: картинки, видео и документы.
 *
 * @remarks
 * Хранилищ два, и выбирает их `payload.config.ts` по `S3_BUCKET`. Задан бакет -
 * файлы лежат в нём (`@payloadcms/storage-s3` сам отключает локальную запись
 * у коллекции). Не задан - файлы держит сама CMS в папке рядом с собой
 * и раздаёт их по `/api/media/file/...`. Схема записи от этого не зависит.
 *
 * Ступени картинок режет sharp при заливке; их имена совпадают с
 * `MEDIA_RENDITIONS` из `contracts`. Поведение записи - в `lib/media-hooks.ts`.
 */

/**
 * @deprecated Папка служебных кадров живёт в `lib/media-folders`, импортировать
 * оттуда. Реэкспорт оставлен для скриптов собранных сайтов.
 */
export { POSTER_PREFIX } from '../lib/media-folders';

/**
 * Во что переводятся картинки и все их ступени.
 *
 * @remarks
 * Одно значение на файл и на производные: заданное только файлу до ступеней
 * не доходит, и они остаются в формате исходника.
 */
const WEBP = { format: 'webp', options: { quality: 82 } } as const;

/** Поле только у картинок: у записи и документа ступеней нет. */
const onlyImages = (data: Record<string, unknown>): boolean =>
  String(data?.['mimeType'] ?? '').startsWith('image/');

/**
 * Ступени на выбор владельцу: те же, по которым режется файл.
 *
 * @remarks
 * Список собирается из шва, а не пишется здесь заново: разойдись они - и в
 * админке предлагалась бы ступень, которой никто не режет.
 */
const RENDITION_OPTIONS = MEDIA_RENDITIONS.map(({ name, width }) => ({
  label: `${name} - до ${width} точек`,
  value: name,
}));

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
    // с записью.
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
    /*
      Ступени берутся из шва: по тому же списку сайт просит варианты, и между
      соседними нет провала - браузер берёт ближайшую не мельче нужной.

      Формат задаётся каждой ступени отдельно: производные наследуют формат
      исходника, и снимок с телефона давал бы копии в jpeg при webp-оригинале.
    */
    imageSizes: MEDIA_RENDITIONS.map(({ name, width }) => ({
      name,
      width,
      height: undefined,
      position: 'centre' as const,
      formatOptions: WEBP,
    })),
    formatOptions: WEBP,
  },
  fields: [
    {
      /**
       * Имя документа в интерфейсе.
       *
       * @remarks
       * Заголовок карточки, крошки и подписи в выпадающих списках Payload
       * берёт из одного поля. Имя файла читалось бы там как `lesson-4.mp4`
       * вместо названия видео.
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
       * Размытая заготовка кадра строкой.
       *
       * @remarks
       * Показывается на месте снимка, пока он идёт по сети. Лежит в записи,
       * а не отдельным файлом: своего запроса у неё нет, и на медленной сети
       * она появляется вместе с разметкой, а не после третьего похода в сеть.
       *
       * Снимается при заливке. У старых файлов пусто - показ тогда прежний,
       * без заготовки.
       */
      name: 'blurData',
      type: 'text',
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
      /**
       * Кадр документа: первая страница PDF.
       *
       * @remarks
       * Показывается только у PDF, потому что только у него и заполняется.
       * У картинки и записи это поле - пустой блок с пояснением про PDF
       * посреди карточки: человек открывает снимок и читает про документы.
       */
      name: 'preview',
      label: 'Превью',
      type: 'upload',
      relationTo: 'media',
      admin: {
        readOnly: true,
        condition: (data) => String(data?.mimeType ?? '') === 'application/pdf',
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
       * Публичный корень хранилища уже заканчивается на `/media`: папка
       * с тем же именем дала бы адрес `/media/media/файл`.
       *
       * Разложить по папкам можно, вписав своё имя; служебные кадры живут
       * в собственной папке.
       */
      defaultValue: '',
      /*
        Переложить файл может тот, кто его залил, и администратор. Перенос
        не деструктивен - файл остаётся тем же, меняется только место, - но
        адрес после него другой, и раздавать это право всем подряд незачем.
      */
      access: {
        update: ({ req: { user }, doc }) => {
          if (!user) return false;
          if (user.role === 'admin') return true;
          const owner = doc?.['uploadedBy'];
          const ownerId = typeof owner === 'object' && owner ? owner['id'] : owner;
          return String(ownerId ?? '') === String(user.id);
        },
      },
      admin: {
        description: 'Пусто — файл лежит в корне хранилища. Имя папки задаётся вручную.',
        position: 'sidebar',
        /*
          Поле показывается только там, где файлы лежат в бакете. Без него
          хранилищем служит сама CMS, и адрес у файла плоский: папка в него
          не входит вовсе, а поле обещало бы то, чего не будет.

          Колонка при этом есть всегда - схема у всех сайтов одна.
        */
        hidden: !process.env['S3_BUCKET'],
      },
    },
    {
      /**
       * Оригинал удалён, его место заняла копия.
       *
       * @remarks
       * Без этой пометки админка выдавала бы самую крупную из копий за
       * оригинал: после удаления она становится самим файлом записи, и по
       * полям её от исходника не отличить. Человек видел бы «Оригинал» там,
       * где оригинала уже нет, и удалил бы следующую копию, считая, что
       * убирает лишнее.
       *
       * Ставится уборкой копий и руками не правится.
       */
      name: 'originalDropped',
      type: 'checkbox',
      defaultValue: false,
      admin: { hidden: true, readOnly: true },
    },
    {
      /*
        Перечень копий с весом и удалением. Стоит перед названием: это первое,
        что нужно увидеть, открыв тяжёлую картинку.
      */
      name: 'copies',
      type: 'ui',
      admin: {
        components: {
          Field: '/admin/components/MediaCopiesField#MediaCopiesField',
        },
      },
    },
    {
      /*
        Каким размером картинка идёт на страницу и каким открывается.

        Размер под место показ выбирает сам, но про снимок владелец знает
        больше: общий план читается и мелким, а весит втрое меньше. Пусто -
        выбирает показ, как и раньше.

        Поля стоят парой сразу за перечнем копий: там же видно, какие размеры
        у файла вообще есть.
      */
      type: 'row',
      fields: [
        {
          name: 'pageStep',
          label: 'Размер на странице',
          type: 'select',
          options: RENDITION_OPTIONS,
          admin: {
            // Условие стоит у самих полей, а не у ряда: ряд - это расстановка,
            // своей видимости у него нет, и поля показывались бы у записи.
            condition: onlyImages,
            description: 'Крупнее выбранного показ не возьмёт. Пусто - выбирает сам.',
          },
        },
        {
          name: 'laneStep',
          label: 'Размер при открытии',
          type: 'select',
          options: RENDITION_OPTIONS,
          admin: {
            condition: onlyImages,
            description: 'Каким файл открывается на весь экран. Пусто - самым крупным.',
          },
        },
      ],
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
       * Пояснение к файлу: показывается под кадром, когда его открыли крупно,
       * и уходит в поисковую выдачу у записей.
       *
       * @remarks
       * Это не `alt`: alt описывает изображение тому, кто его не видит,
       * а описание рассказывает, о чём снимок или запись - что за этап, что
       * на кадре.
       */
      name: 'description',
      label: 'Описание',
      type: 'textarea',
      admin: {
        description: 'Показывается под кадром, когда его открыли крупно, и в поисковой выдаче.',
        condition: (data) => !String(data?.mimeType ?? '').startsWith('application/'),
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
      label: 'Чей канал',
      type: 'relationship',
      relationTo: 'users',
      /*
        Владение правится: владелец сайта заливает видео специалиста под своей
        учётной записью, а канал берётся отсюда - запись надо переложить на
        специалиста. Менять может только администратор: для редактора это
        чужая запись.
      */
      access: {
        update: ({ req: { user } }) => user?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description:
          'На чьём канале показывается запись. Заполняется тем, кто загрузил; администратор может переложить на другого - например, когда видео специалиста заливали за него.',
      },
    },
    {
      /**
       * Кому выдаётся ключ.
       *
       * @remarks
       * По умолчанию закрыто: открытая по умолчанию платная запись доступна
       * любому с того мгновения, как дорезалась, и до того, как автор
       * вспомнит переключить. Лишний раз открыть запись дёшево и обратимо,
       * а утёкшую уже не закрыть - её успели скачать.
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
       *
       * Служебное - третье состояние, а не оттенок скрытого: у такой записи нет
       * ни места в канале, ни своей страницы. Она живёт только там, куда её
       * поставили руками: фоном обложки, вставкой в текст, куском блока. Без
       * этого фон страницы специалиста оказывался отдельной записью в канале
       * и открывался чужой ссылкой как самостоятельное видео.
       */
      name: 'visibility',
      label: 'Публикация',
      type: 'select',
      defaultValue: 'hidden',
      options: [
        { label: 'Опубликовано', value: 'published' },
        { label: 'Скрыто', value: 'hidden' },
        { label: 'Служебное - без своей страницы', value: 'internal' },
      ],
      admin: {
        position: 'sidebar',
        condition: (data) => String(data?.mimeType ?? '').startsWith('video/'),
        description:
          'Опубликовано - видно в канале. Скрыто - открывается по ссылке, но в списках нет. Служебное - нет ни в канале, ни своей страницы: только там, куда поставили руками. Доступа не касается.',
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
  endpoints: [
    {
      /**
       * Уборка одной копии файла.
       *
       * @remarks
       * Здесь только перевод запроса в вызов и обратно: что станет с записью,
       * решает `withoutCopy`, файл убирает `dropStoredFile`. Обе части
       * проверяются без сети.
       *
       * Убирать копии может тот же, кто удаляет файлы целиком: это действие
       * необратимо и уменьшает то, что уже роздано по страницам.
       */
      path: '/:id/copies/:step',
      method: 'delete',
      handler: async (req) => {
        /*
          В своём обработчике Payload не разбирает вход сам: `req.user` там
          пуст даже у вошедшего. Поэтому спрашиваем его явно по заголовкам
          запроса - иначе администратор получает отказ на своё же действие.
        */
        const { user } = await req.payload.auth({ headers: req.headers });
        if (user?.role !== 'admin') {
          return Response.json(
            { error: 'Удаление копий доступно администратору' },
            { status: 403 },
          );
        }

        const id = req.routeParams?.['id'];
        const step = String(req.routeParams?.['step'] ?? '');
        if (!id) return Response.json({ error: 'Файл не указан' }, { status: 400 });

        const doc = await req.payload.findByID({ collection: 'media', id: String(id), depth: 0 });
        // Оригинал в адресе приходит словом, а у записи его ступень без имени.
        const decision = withoutCopy(doc as MediaRecord, step === 'original' ? '' : step);
        if (!decision.ok) return Response.json({ error: decision.why }, { status: 400 });

        const copy = copiesOf(doc as MediaRecord).find((item) => item.filename === decision.drop);
        await dropStoredFile(decision.drop, copy?.url ?? '');
        await req.payload.update({
          collection: 'media',
          id: String(id),
          data: decision.patch,
          depth: 0,
        });

        return Response.json({ dropped: decision.drop });
      },
    },
  ],
  hooks: {
    beforeOperation: [normalizeUploadName],
    beforeChange: [
      moveOnPrefixChange,
      measureImage,
      stampUploader,
      ensureAuthorChannel,
      issueShortCode,
      syncPreviewUrl,
      syncTitle,
    ],
    beforeDelete: [softDeleteVideo],
    afterRead: [exposeManifestRoute, exposeStreamPack, bustCdnCache],
    afterChange: [dropMovedLeftovers, queueVideoCut, makePdfPreview],
  },
};
