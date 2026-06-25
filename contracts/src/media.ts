/**
 * Медиа-документ: загруженный файл (картинка / pdf / документ).
 *
 * @remarks
 * Источник правды — коллекция `Media` в Payload (см. cms/collections/Media.ts).
 * Здесь — публичный контракт того что `client` получает в ответ от CMS.
 * Не повторяет внутренние поля Payload (id-схема, timestamps управления) —
 * только то что нужно фронту для рендера.
 */
export interface MediaDoc {
  /** Идентификатор документа в CMS. */
  readonly id: string;
  /** Публичный URL для отдачи (CDN или путь относительно сайта). */
  readonly url: string;
  /** Альтернативный текст. Обязателен — для доступности и SEO. */
  readonly alt: string;
  /** Ширина изображения в пикселях (если применимо). */
  readonly width?: number;
  /** Высота изображения в пикселях (если применимо). */
  readonly height?: number;
  /** MIME-тип файла, напр. `image/jpeg`, `application/pdf`. */
  readonly mimeType?: string;
  /** Размер файла в байтах. */
  readonly filesize?: number;
  /** Производные размеры (превью, разные брейкпоинты). Ключ — имя варианта. */
  readonly sizes?: Readonly<Record<string, MediaSize>>;
}

/**
 * Производный вариант медиа (resize) — например `thumbnail`, `card`, `hero`.
 *
 * @remarks
 * Имена вариантов задаются в Payload-конфиге коллекции Media (см. `imageSizes`).
 */
export interface MediaSize {
  readonly url: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Минимальная ссылка на медиа в полях документов: либо строка-id, либо populated объект.
 *
 * @remarks
 * Payload по умолчанию возвращает `id` если глубина запроса 0, и объект если ≥ 1.
 * Контракт допускает оба варианта — `client` должен уметь обрабатывать.
 */
export type MediaRef = string | MediaDoc;
