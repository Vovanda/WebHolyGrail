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
  /*
    Состав доступа: код открывает не одну вещь, а всё, что в доступ положено, -
    подборки и отдельные записи вместе. Одиночное значение принимается ради
    сайтов, собранных на прежнем шаблоне (R10).
  */
  granted: GrantedAccess | ReadonlyArray<GrantedAccess> | null,
  setId: string | number | null,
): ReadonlyArray<VideoSetItem> {
  if (!granted) return items;

  const opened = Array.isArray(granted) ? granted : [granted as GrantedAccess];
  if (opened.length === 0) return items;

  // Подборка этого списка среди открытых - значит открылось всё, что в нём.
  const wholeSet = opened.some(
    (one) => one.kind === 'playlists' && setId !== null && String(setId) === String(one.id),
  );
  const openedIds = new Set(
    opened.filter((one) => one.kind === 'media').map((one) => String(one.id)),
  );

  const next = items.map((item) =>
    item.locked && (wholeSet || openedIds.has(String(item.id))) ? { ...item, locked: false } : item,
  );

  // Ничего не поменялось - отдаём прежний список: по этому равенству вызывающий
  // понимает, что показывать снятие замков незачем.
  return next.some((item, index) => item !== items[index]) ? next : items;
}
