import type { VideoSetItem } from 'contracts';

/**
 * Что открылось после ввода кода.
 *
 * @remarks
 * Право выдаётся на то, что названо в коде: на подборку целиком или на одну
 * запись. Список должен снять замок ровно с этого, а не со всего подряд -
 * иначе зритель видит открытое там, где сервер откажет, и упирается в замок
 * уже нажав.
 *
 * Событие приходит всем спискам страницы разом: рядом с плеером, в боковой
 * панели, в соседнем блоке. Поэтому решение принимает каждый список сам,
 * сверяя открытое со своим.
 */
export interface GrantedAccess {
  readonly kind: 'playlists' | 'media';
  readonly id: string | number;
}

/**
 * Снимает замки с того, чего касается выданное право.
 *
 * @remarks
 * Сравнение по строке: номер приходит и числом, и строкой - из адреса он
 * всегда строка, из ответа обычно число, и `1 !== '1'` тихо оставил бы замок
 * на месте.
 */
export function unlockGranted(
  items: ReadonlyArray<VideoSetItem>,
  granted: GrantedAccess | null,
  setId: string | number | null,
): ReadonlyArray<VideoSetItem> {
  if (!granted) return items;

  if (granted.kind === 'playlists') {
    // Чужая подборка этого списка не касается: код на соседний курс не должен
    // снимать замки здесь.
    if (setId === null || String(setId) !== String(granted.id)) return items;
    return items.map((item) => (item.locked ? { ...item, locked: false } : item));
  }

  return items.map((item) =>
    item.locked && String(item.id) === String(granted.id) ? { ...item, locked: false } : item,
  );
}
