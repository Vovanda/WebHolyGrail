/**
 * Открытая лента в адресе страницы: `#lb=<группа>/<номер>`.
 *
 * @remarks
 * По такому адресу ссылку на кадр можно переслать, а шаг назад закрывает
 * ленту, а не уводит со страницы. Формат один на обе ленты: лента страницы
 * пишет группу `page`, лента своей группы - её имя.
 */

const PREFIX = '#lb=';
const PATTERN = /^#lb=([^/]+)\/(\d+)$/;

/** Группа ленты страницы. */
export const PAGE_GROUP = 'page';

/** Открытый кадр: в какой группе и какой по счёту. */
export interface LaneAt {
  readonly group: string;
  readonly index: number;
}

/** Метка открытого кадра для адреса. */
export function laneHash(group: string, index: number): string {
  return `${PREFIX}${encodeURIComponent(group)}/${index}`;
}

/** Открытый кадр по метке адреса; `null` - лента не открыта или метка испорчена. */
export function parseLaneHash(hash: string): LaneAt | null {
  const found = PATTERN.exec(hash);
  if (!found) return null;
  const index = Number(found[2]);
  if (!Number.isSafeInteger(index)) return null;
  try {
    return { group: decodeURIComponent(found[1] ?? ''), index };
  } catch {
    return null;
  }
}

/** Стоит ли в адресе метка какой-нибудь ленты. */
export function isLaneHash(hash: string): boolean {
  return hash.startsWith(PREFIX);
}
