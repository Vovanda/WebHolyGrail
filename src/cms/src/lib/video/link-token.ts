import { randomBytes } from 'node:crypto';

/**
 * Адрес ссылки-приглашения на подборку.
 *
 * @remarks
 * Ссылка - не код: её не диктуют по телефону и не переписывают из смс, её
 * присылают целиком. Поэтому здесь ровно обратные требования к коду доступа:
 * алфавит берётся широкий, длина - с запасом, а похожие начертания не мешают,
 * потому что человек ничего не набирает руками.
 *
 * Отсюда и разведение: короткий код в адресе ссылки означал бы, что подобрать
 * чужое приглашение можно перебором, а длинный набор в трубку не продиктуешь.
 * Одной машинкой два этих требования не закрыть.
 */

/** Алфавит адреса: цифры, обе буквенные раскладки, дефис и подчёркивание. */
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

/**
 * Длина адреса.
 *
 * @remarks
 * Двадцать два символа этого алфавита - примерно сто тридцать бит. Перебор
 * бессмыслен даже без ограничения по частоте, а оно всё равно стоит.
 */
const LENGTH = 22;

export function generateLinkToken(length = LENGTH): string {
  // Байты берутся с запасом, а не влезающие в алфавит нацело отбрасываются:
  // иначе первые символы выпадали бы чаще остальных.
  const limit = Math.floor(256 / ALPHABET.length) * ALPHABET.length;
  let token = '';
  while (token.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte >= limit) continue;
      token += ALPHABET[byte % ALPHABET.length];
      if (token.length === length) break;
    }
  }
  return token;
}

/** Похож ли на наш адрес - чтобы не ходить в базу за очевидно чужим. */
export function looksLikeLinkToken(value: string): boolean {
  if (value.length !== LENGTH) return false;
  return [...value].every((char) => ALPHABET.includes(char));
}
