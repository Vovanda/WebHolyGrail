/**
 * Частота обращений за ключами.
 *
 * @remarks
 * Зритель смотрит запись в реальном времени и просит ключ раз в несколько
 * минут - по одному на запись, изредка при смене качества. Тот, кто выкачивает
 * курс целиком, запрашивает ключи десятками подряд: разница между просмотром и
 * скачиванием видна именно здесь.
 *
 * Поэтому считаем ключи на зрителя за час. Порог поставлен заведомо выше
 * обычного дня: человек, посмотревший подряд десяток уроков, его не заметит,
 * а скачиватель упирается за минуты.
 *
 * Ограничение не защищает от упорного - он растянет выкачку по времени и
 * заведёт несколько токенов. Задача другая: сделать выкачивание медленным и
 * заметным.
 */

/** Сколько ключей за час выглядит как просмотр. */
const KEYS_PER_HOUR = 60;

/** Окно счёта. */
const WINDOW_MS = 60 * 60 * 1000;

interface Usage {
  keys: number;
  firstAt: number;
}

const byViewer = new Map<string, Usage>();

export interface RateDecision {
  readonly allowed: boolean;
  /** Через сколько секунд счёт начнётся заново. */
  readonly retryAfterSeconds: number;
}

/** Можно ли этому зрителю получить ещё один ключ. */
export function checkKeyRate(viewer: string, now: number = Date.now()): RateDecision {
  const record = byViewer.get(viewer);

  if (!record || now - record.firstAt > WINDOW_MS) {
    byViewer.set(viewer, { keys: 1, firstAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  record.keys += 1;
  if (record.keys <= KEYS_PER_HOUR) return { allowed: true, retryAfterSeconds: 0 };

  const left = WINDOW_MS - (now - record.firstAt);
  return { allowed: false, retryAfterSeconds: Math.ceil(left / 1000) };
}

/** Только для тестов: очищает счёт между проверками. */
export function resetKeyRate(): void {
  byViewer.clear();
}
