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
    options: {
      ladder: ReadonlyArray<HlsRung>;
      keyUri: string;
      /** Сколько записи уже обработано, от нуля до единицы. */
      onProgress?: (share: number) => void;
    },
  ): Promise<{
    files: ReadonlyArray<HlsFile>;
    rungs: ReadonlyArray<HlsRung>;
    durationSeconds: number | null;
    secret: Buffer;
    /** Кадр для обложки; `null` — если вытащить не удалось. */
    poster: Buffer | null;
    /** Лента кадров для перемотки; `null` — если снять не удалось. */
    storyboard: {
      image: Buffer;
      columns: number;
      rows: number;
      count: number;
      frameWidth: number;
      frameHeight: number;
      intervalSeconds: number;
    } | null;
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
  /** Автор: задаёт область хранения. `null` — файл залит без учётной записи. */
  readonly ownerId: string | number | null;
}

/** Итог нарезки, который сохраняется в каталог. */
export interface RenditionResult {
  readonly playlistUrl: string;
  readonly prefix: string;
  readonly qualities: ReadonlyArray<number>;
  readonly durationSeconds: number | null;
  readonly secret: string;
  /** Лента кадров для перемотки: адрес и устройство сетки. */
  readonly storyboard: StoryboardRendition | null;
}

/** Где лежит лента кадров и как она устроена. */
export interface StoryboardRendition {
  readonly url: string;
  readonly columns: number;
  readonly rows: number;
  readonly count: number;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly intervalSeconds: number;
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
  /**
   * Отмечает, сколько записи уже обработано.
   *
   * @remarks
   * Пишется редко: карточке хватает шага в несколько процентов, а запись в базу
   * на каждый кадр нагружала бы её впустую.
   */
  saveProgress(id: string | number, percent: number): Promise<void>;
}

export interface VideoPorts {
  readonly encoder: EncoderPort;
  readonly storage: StoragePort;
  readonly catalog: CatalogPort;
}
