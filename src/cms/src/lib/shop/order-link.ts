import { createHash, randomBytes } from 'node:crypto';

/**
 * Секрет ссылки заказа: по нему покупатель без входа видит заказ и счета.
 *
 * @remarks
 * 128 случайных бит - перебором не найти. В базе лежит только хэш: утёкшая
 * база не даёт открыть чужие заказы. Сравнение идёт поиском по хэшу в базе,
 * поэтому время ответа не выдаёт, сколько символов совпало.
 */
export function newOrderSecret(): { token: string; hash: string } {
  const token = randomBytes(16).toString('base64url');
  return { token, hash: hashOrderSecret(token) };
}

export function hashOrderSecret(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Годен ли присланный секрет по виду: 22 знака base64url. Иначе в базу не ходим. */
export const isOrderSecret = (token: unknown): token is string =>
  typeof token === 'string' && /^[A-Za-z0-9_-]{22}$/.test(token);
