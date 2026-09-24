import { isLaneHash, laneHash } from '@/lib/lane-hash';

/**
 * Лента и история браузера.
 *
 * @remarks
 * Открытие добавляет запись, листание меняет её на месте, закрытие снимает.
 * Поэтому шаг назад закрывает ленту целиком, а не отматывает её по кадру.
 * История бывает недоступна - во встроенной рамке, при запрете браузера, -
 * и лента от этого не ломается: она просто работает без адреса.
 */

export function pushLane(group: string, index: number): void {
  try {
    window.history.pushState({ lb: group, i: index }, '', laneHash(group, index));
  } catch {
    // Без записи в истории лента откроется так же, только без адреса.
  }
}

export function replaceLane(group: string, index: number): void {
  try {
    window.history.replaceState({ lb: group, i: index }, '', laneHash(group, index));
  } catch {
    // Адрес не обновился - на саму ленту это не влияет.
  }
}

/**
 * Снять свою запись из истории.
 *
 * @remarks
 * Только если метка ленты в адресе: у открытой по присланной ссылке своей
 * записи нет, и шаг назад увёл бы с сайта.
 */
export function leaveLane(): void {
  if (!isLaneHash(window.location.hash)) return;
  try {
    window.history.back();
  } catch {
    // Не вышло шагнуть назад - убираем метку, чтобы адрес не врал.
    window.location.hash = '';
  }
}
