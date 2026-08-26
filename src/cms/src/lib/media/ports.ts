import type { HlsFile, HlsRung } from '../hls';

/**
 * Порты подготовки видео: кодировщик, хранилище, каталог.
 *
 * @remarks
 * Сценарий подготовки не должен знать ни про ffmpeg, ни про S3, ни про Payload.
 * Не ради красоты: кодирование когда-нибудь может уехать во внешний сервис,
 * хранилище — смениться на другого провайдера, а сам порядок действий при этом
 * обязан остаться прежним. Плюс порядок можно проверить тестом, не поднимая
 * ни базы, ни бакета, ни ffmpeg.
 *
 * Реализации живут в `adapters.ts`, там же собирается набор по умолчанию.
 */

/** Кодировщик: исходник на входе, готовая раздача на выходе. */
export interface EncoderPort {
  transcode(
    source: Buffer,
    options: { ladder: ReadonlyArray<HlsRung>; keyUri: string },
  ): Promise<{
    files: ReadonlyArray<HlsFile>;
    rungs: ReadonlyArray<HlsRung>;
    durationSeconds: number | null;
    secret: Buffer;
    /** Кадр для обложки; `null` — если вытащить не удалось. */
    poster: Buffer | null;
  }>;
}

/** Хранилище раздачи. Адреса — те же, что видит зритель. */
export interface StoragePort {
  /** Скачивает исходник по его публичному адресу. */
  readSource(url: string): Promise<Buffer>;
  /** Кладёт файл раздачи. */
  put(key: string, file: HlsFile): Promise<void>;
  /** Убирает всё под адресом — прошлую нарезку. */
  removeFolder(prefix: string): Promise<void>;
  /** Убирает один объект — исходник после нарезки. */
  remove(key: string): Promise<void>;
  /** Ключ объекта из его публичного адреса. */
  keyFromUrl(url: string): string;
  /** Публичный адрес по ключу. */
  urlForKey(key: string): string;
}

/** Что известно о медиафайле до нарезки. */
export interface VideoRecord {
  readonly id: string | number;
  readonly mimeType: string;
  readonly filename: string | null;
  readonly url: string;
  /** Адрес прошлой нарезки, если она была. */
  readonly previousPrefix: string | null;
  /** Обложка уже задана — своя не перетирается. */
  readonly hasPoster: boolean;
}

/** Итог нарезки, который сохраняется в каталог. */
export interface RenditionResult {
  readonly playlistUrl: string;
  readonly prefix: string;
  readonly qualities: ReadonlyArray<number>;
  readonly durationSeconds: number | null;
  readonly secret: string;
}

/** Каталог видео: чтение записи, сохранение итога, выбор ступеней. */
export interface CatalogPort {
  read(id: string | number): Promise<VideoRecord>;
  saveRendition(id: string | number, result: RenditionResult): Promise<void>;
  ladder(): Promise<ReadonlyArray<HlsRung>>;
  /**
   * Сохраняет кадр обложкой ролика.
   *
   * @remarks
   * Отдельным медиафайлом, а не полем с картинкой: так обложка попадает в то же
   * хранилище и получает тот же адрес раздачи, что и всё остальное.
   */
  savePoster(id: string | number, poster: Buffer): Promise<void>;
}

export interface VideoPorts {
  readonly encoder: EncoderPort;
  readonly storage: StoragePort;
  readonly catalog: CatalogPort;
}
