import { randomBytes } from 'node:crypto';

/**
 * Короткий код видео для адреса вида `/@автор/v/a7Bx9K2`.
 *
 * @remarks
 * Номер медиафайла в адрес не годится: по нему видео перебираются подряд,
 * и закрытые обнаруживаются простым увеличением числа. Плюс номер выдаёт,
 * сколько всего загружено — лишняя информация о размерах хозяйства.
 *
 * Алфавит без похожих символов: ноль и `O`, единица, `l` и `I` в ссылке,
 * прочитанной с экрана или продиктованной по телефону, путаются постоянно.
 */
const ALPHABET = '23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

/** Длина кода. Семь символов дают триллионы вариантов — перебор бессмыслен. */
const LENGTH = 7;

export function generateShortCode(): string {
  // Берём байты с запасом и отбрасываем те, что не делятся на алфавит нацело:
  // иначе первые символы алфавита выпадали бы чаще остальных.
  const limit = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let code = '';
  while (code.length < LENGTH) {
    for (const byte of randomBytes(LENGTH * 2)) {
      if (byte >= limit) continue;
      code += ALPHABET[byte % ALPHABET.length];
      if (code.length === LENGTH) break;
    }
  }
  return code;
}

/** Похож ли на наш код — чтобы не ходить в базу за очевидно чужим адресом. */
export function looksLikeShortCode(value: string): boolean {
  if (value.length !== LENGTH) return false;
  return [...value].every((char) => ALPHABET.includes(char));
}

/**
 * @deprecated Код доступа переехал в `access-code.ts` - это разные машинки:
 * адресный код живёт в ссылке, код доступа диктуют по телефону. Реэкспорт
 * оставлен, чтобы не ломать сайты, собранные на прежнем пути.
 */
export { generateAccessCode, normalizeAccessCode } from './access-code';
