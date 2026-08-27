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
 * Алфавит кода доступа: цифры и заглавные буквы, кроме `I`, `L`, `O` и `U`.
 *
 * @remarks
 * Этот код человек вводит руками, диктует по телефону и переписывает из смс.
 * Из каждой пары похожих начертаний в алфавите остаётся ровно один символ —
 * цифра: `O` выброшена в пользу нуля, `I` и `L` в пользу единицы. Тогда
 * привычную опечатку можно исправить однозначно, а не гадать, что имелось
 * в виду. `U` убрана, чтобы в коде не сложилось бранное слово.
 *
 * Раскладка та же, что у Crockford Base32: она для диктовки и придумана.
 */
const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Код доступа к плейлисту.
 *
 * @remarks
 * Шесть символов — около миллиарда вариантов. Этого достаточно, только пока
 * код живёт минуты и попытки погашения ограничены по частоте: без лимита
 * перебор становится делом времени.
 */
export function generateAccessCode(length = 6): string {
  const limit = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;
  let code = '';
  while (code.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte >= limit) continue;
      code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (code.length === length) break;
    }
  }
  return code;
}

/**
 * Приводит введённый код к тому виду, в каком он выдан.
 *
 * @remarks
 * Человек переписывает с ошибками ровно там, где символы похожи: буква «O»
 * вместо нуля, «I» и «L» вместо единицы. Букв этих в алфавите нет, поэтому
 * подмена однозначна — исправляем вместо того, чтобы отвечать «код неверен».
 */
export function normalizeAccessCode(value: string): string {
  return (
    value
      .trim()
      .toUpperCase()
      // Похожие начертания сводятся к тому символу, который в алфавите есть:
      // иначе исправленный код не совпал бы с выданным.
      .replace(/O/g, '0')
      .replace(/[IL]/g, '1')
      // Пробелы, дефисы и прочее, чем человек делит код при переписывании.
      .replace(/[^0-9A-Z]/g, '')
  );
}
