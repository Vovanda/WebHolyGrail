/**
 * Ограничение частоты попыток погашения.
 *
 * @remarks
 * Код короткий, и без ограничения его подбирают перебором: шесть символов
 * перебираются машиной за часы, а живой человек ошибается два-три раза подряд.
 * Поэтому после нескольких неудач подряд с одного места ответ приходит с
 * задержкой, а сам код при этом не расходуется.
 *
 * Считаем по адресу обратившегося, а не по коду: иначе достаточно одного
 * подбора, чтобы заблокировать чужой рабочий код всем остальным.
 *
 * Память живёт в самом приложении: на одном узле этого достаточно, а на
 * нескольких - каждый узел ограничивает свою долю попыток, что тоже сбивает
 * перебор. Общий счётчик появится вместе с общим хранилищем.
 */

/** Сколько промахов подряд допустимо до задержки. */
const FREE_MISSES = 5;

/** Окно, за которое считаются промахи. */
const WINDOW_MS = 10 * 60 * 1000;

/** Сколько ждать после превышения. Растёт с каждым промахом, но не бесконечно. */
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60 * 1000;

interface Attempts {
  misses: number;
  firstAt: number;
  blockedUntil: number;
}

const byClient = new Map<string, Attempts>();

export interface ThrottleDecision {
  /** Можно ли пробовать прямо сейчас. */
  readonly allowed: boolean;
  /** Через сколько секунд имеет смысл повторить. */
  readonly retryAfterSeconds: number;
}

/** Проверяет, можно ли этому обратившемуся пробовать код. */
export function checkRedeemAttempt(client: string, now: number = Date.now()): ThrottleDecision {
  const record = byClient.get(client);
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  // Окно вышло - счётчик начинается заново: человек, ошибшийся утром, вечером
  // не должен ждать.
  if (now - record.firstAt > WINDOW_MS) {
    byClient.delete(client);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.blockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Отмечает промах.
 *
 * @remarks
 * Задержка удваивается с каждым промахом сверх бесплатных: подбор становится
 * бессмысленным, а живой человек, ошибшийся пару раз, ничего не замечает.
 */
export function noteRedeemMiss(client: string, now: number = Date.now()): void {
  const record = byClient.get(client);

  if (!record || now - record.firstAt > WINDOW_MS) {
    byClient.set(client, { misses: 1, firstAt: now, blockedUntil: 0 });
    return;
  }

  record.misses += 1;
  if (record.misses > FREE_MISSES) {
    const over = record.misses - FREE_MISSES;
    const delay = Math.min(BASE_DELAY_MS * 2 ** (over - 1), MAX_DELAY_MS);
    record.blockedUntil = now + delay;
  }
}

/** Забывает промахи: код подошёл, счёт обнуляется. */
export function forgetRedeemMisses(client: string): void {
  byClient.delete(client);
}

/** Только для тестов: очищает память между проверками. */
export function resetRedeemThrottle(): void {
  byClient.clear();
}
