import type { StoragePort } from './ports';

/**
 * Отложенная уборка удалённых видео.
 *
 * @remarks
 * Удаление видео — единственное необратимое действие в системе: оригинал
 * стёрт сразу после нарезки, и восстановить его неоткуда. Поэтому «удалить»
 * означает пометить: видео пропадает с сайта немедленно, а файлы лежат ещё
 * несколько недель.
 *
 * Сценарий чистый: ему передают список помеченных и порт хранилища, он решает,
 * чью папку пора стирать. Ни базы, ни бакета для проверки не нужно.
 */

/** Помеченный к удалению видео. */
export interface PurgeCandidate {
  readonly id: string | number;
  /** Когда пометили, ISO. */
  readonly deletedAt: string;
  /** Папка раздачи; `null` — нарезки не было, стирать нечего. */
  readonly prefix: string | null;
}

export interface PurgeArgs {
  readonly candidates: ReadonlyArray<PurgeCandidate>;
  readonly storage: StoragePort;
  /** Сколько дней ждать до физического удаления. */
  readonly afterDays: number;
  readonly now: Date;
  /** Убирает запись из каталога после того, как файлы стёрты. */
  readonly forget: (id: string | number) => Promise<void>;
  readonly logger?: (message: string) => void;
}

export interface PurgeSummary {
  readonly purged: ReadonlyArray<string | number>;
  readonly waiting: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function purgeDeleted({
  candidates,
  storage,
  afterDays,
  now,
  forget,
  logger,
}: PurgeArgs): Promise<PurgeSummary> {
  const log = logger ?? (() => {});
  const purged: Array<string | number> = [];
  let waiting = 0;

  for (const candidate of candidates) {
    const markedAt = new Date(candidate.deletedAt).getTime();
    // Некорректную дату не трогаем: лучше оставить файлы, чем стереть по
    // ошибке разбора то, что удалять не собирались.
    if (Number.isNaN(markedAt)) continue;

    // Граница включительно: ровно в день истечения ещё ждём. Сутки в запасе
    // стоят дешевле, чем стёртый видео, который собирались вернуть.
    if (now.getTime() - markedAt <= afterDays * DAY_MS) {
      waiting += 1;
      continue;
    }

    // Папка стирается целиком одним префиксом — за этим и держим область
    // хранения: обходить объекты по одному не нужно.
    if (candidate.prefix) await storage.removeFolder(candidate.prefix);

    // Запись убираем последней: если стирание упало, видео остаётся
    // помеченным и попадёт в следующий проход.
    await forget(candidate.id);
    purged.push(candidate.id);
    log(`стёрт видео ${candidate.id}`);
  }

  return { purged, waiting };
}
