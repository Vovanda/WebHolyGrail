/**
 * Частота обращений за ключами.
 *
 * @remarks
 * Ключ у записи не один: она поделена на криптопериоды, и зритель приходит
 * заново на каждой границе. Часовая запись при минутном периоде - это шестьдесят
 * обращений за час просмотра, и предел «шестьдесят в час» такой просмотр обрывал
 * бы на середине. Считать надо темп, а не общее число.
 *
 * Темп задаёт сам просмотр: один ключ на период плюс запас на буфер, перемотки
 * и вторую дорожку качества. Тот, кто выкачивает курс, просит ключи подряд и
 * упирается за секунды, а зритель не замечает предела никогда - сколько бы он
 * ни смотрел.
 *
 * Считаются разные ключи, а не запросы: страница держит плеер в блоке, в тексте
 * и в подборке, все на одной записи, и просят они один и тот же ключ. Повтор
 * запаса не тратит - иначе витрина упиралась бы в предел за две перезагрузки,
 * а выкачивание, которое как раз идёт по разным ключам, шло бы столько же.
 *
 * Ограничение не защищает от упорного: он растянет выкачку по времени и заведёт
 * несколько идентичностей. Задача другая - сделать выкачивание медленным и заметным.
 */

/**
 * Сколько разных ключей подряд можно взять быстрее темпа просмотра.
 *
 * @remarks
 * Плеер тянет вперёд на буфер, при старте берёт ключ сразу для двух дорожек
 * качества, а зритель первым делом перематывает. Запас покрывает это и ещё
 * оставляет место на несколько прыжков по записи.
 */
const BURST = 30;

/**
 * Как быстро запас восполняется: один ключ за столько миллисекунд.
 *
 * @remarks
 * Двадцать секунд - это минимальный криптопериод, какой владелец может выставить
 * настройкой. Значит даже на самой мелкой нарезке восполнение идёт не медленнее,
 * чем зритель проходит запись.
 */
const REFILL_MS = 20 * 1000;

/**
 * Сколько помнить уже выданный ключ.
 *
 * @remarks
 * Полчаса покрывают и перезагрузку страницы, и возврат к записи после чтения
 * соседней. Дольше держать незачем: к тому времени запас всё равно восполнен.
 */
const SEEN_MS = 30 * 60 * 1000;

/** Сколько разных ключей помнить на зрителя, чтобы память не росла без края. */
const SEEN_LIMIT = 300;

export interface RateState {
  /** Сколько разных ключей ещё можно взять прямо сейчас. */
  readonly left: number;
  /** Когда запас считался в последний раз. */
  readonly at: number;
  /** Уже выданные ключи и когда: `запись:период` → время выдачи. */
  readonly seen: Readonly<Record<string, number>>;
}

export interface RateDecision {
  readonly allowed: boolean;
  /** Через сколько секунд появится следующий ключ. */
  readonly retryAfterSeconds: number;
}

export const emptyRateState = (now: number): RateState => ({ left: BURST, at: now, seen: {} });

/**
 * Решение по одному запросу ключа.
 *
 * @remarks
 * Чистое: ни времени, ни хранилища внутри. Где лежит счёт - память процесса или
 * общая таблица, - решает вызывающий.
 */
export function decideKeyRate(
  state: RateState,
  key: string,
  now: number,
): { readonly decision: RateDecision; readonly next: RateState } {
  // Запас восполняется временем: сколько прошло, столько ключей и вернулось,
  // но не больше начального - иначе за ночь накопился бы запас на выкачку.
  const restored = Math.floor((now - state.at) / REFILL_MS);
  const left = Math.min(BURST, state.left + restored);
  const at = restored > 0 ? state.at + restored * REFILL_MS : state.at;
  const seen = fresh(state.seen, now);

  // Тот же ключ этот зритель уже получал: отдать его снова не значит унести
  // больше записи, чем у него и так есть.
  if (seen[key] !== undefined) {
    return {
      decision: { allowed: true, retryAfterSeconds: 0 },
      next: { left, at, seen: { ...seen, [key]: now } },
    };
  }

  if (left <= 0) {
    return {
      decision: { allowed: false, retryAfterSeconds: Math.ceil((REFILL_MS - (now - at)) / 1000) },
      next: { left, at, seen },
    };
  }

  return {
    decision: { allowed: true, retryAfterSeconds: 0 },
    next: { left: left - 1, at, seen: { ...seen, [key]: now } },
  };
}

/** Забывает давние ключи и лишние, если их накопилось слишком много. */
function fresh(seen: Readonly<Record<string, number>>, now: number): Record<string, number> {
  const alive = Object.entries(seen).filter(([, when]) => now - when < SEEN_MS);
  if (alive.length <= SEEN_LIMIT) return Object.fromEntries(alive);

  // Через край выходит только тот, кто ходит за множеством разных ключей, -
  // ему и терять давние.
  const newest = alive.sort(([, a], [, b]) => b - a).slice(0, SEEN_LIMIT);
  return Object.fromEntries(newest);
}

/**
 * Можно ли этому зрителю получить ключ - счёт в памяти процесса.
 *
 * @deprecated Счёт памяти не переживает выкладку: цвета работают на одной базе,
 * а память у каждого своя. Общий счёт - `checkKeyRateShared` в соседнем файле.
 * Оставлено для сайтов, которые зовут прежнее имя (R10).
 */
const byViewer = new Map<string, RateState>();

export function checkKeyRate(viewer: string, key: string, now: number = Date.now()): RateDecision {
  const state = byViewer.get(viewer) ?? emptyRateState(now);
  const { decision, next } = decideKeyRate(state, key, now);
  byViewer.set(viewer, next);
  return decision;
}

/** Только для тестов: очищает счёт между проверками. */
export function resetKeyRate(): void {
  byViewer.clear();
}
