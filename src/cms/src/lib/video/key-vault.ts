import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Хранение секрета потока: в базе он лежит завёрнутым в мастер-ключ.
 *
 * @remarks
 * Секрет у каждого видео свой, поэтому держать их в хранилище секретов нельзя:
 * на тысячу видео пришлась бы тысяча записей и поход по сети на каждую выдачу
 * ключа. Но и открытым текстом в базе им не место — расшифрованный дамп тогда
 * равен ключам от всего закрытого, а бэкапы уезжают дальше, чем сама база.
 *
 * Поэтому в базе лежит секрет, зашифрованный одним мастер-ключом на весь сайт;
 * сам мастер-ключ живёт в Infisical и в базу не попадает. Так утёкший дамп
 * бесполезен, а ходить по сети за каждым видео не приходится: мастер-ключ
 * один и держится в памяти процесса.
 *
 * Ротация мастер-ключа перезаворачивает секреты и видео не трогает вовсе —
 * сегменты остаются прежними, кеш сети раздачи не сбрасывается.
 */

/** Признак завёрнутого значения: три части через точку, как у конверта зрителя. */
const PARTS = 3;
const SEPARATOR = '.';

/**
 * Мастер-ключ из окружения.
 *
 * @remarks
 * `null` — ключ не задан: тогда секреты хранятся как раньше, открытым текстом.
 * Это нужно, чтобы включение ключа не обрушило уже залитые видео и чтобы
 * локальная разработка работала без него.
 */
export function masterKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const raw = env['VIDEO_MASTER_KEY'];
  if (!raw) return null;

  const key = Buffer.from(raw, 'base64');
  // Короткий ключ хуже отсутствующего: он создаёт видимость защиты. Поэтому
  // не подгоняем и не дополняем, а отказываемся.
  if (key.length !== 32) {
    throw new Error('VIDEO_MASTER_KEY должен быть 32 байтами в base64 — иначе это не ключ.');
  }
  return key;
}

/**
 * Заворачивает секрет видео в мастер-ключ.
 *
 * @remarks
 * AES-256-GCM: помимо шифрования он даёт метку подлинности, поэтому подменённое
 * в базе значение не развернётся в мусор, который потом молча уедет в плеер.
 *
 * Без мастер-ключа возвращает секрет как есть — состояние до включения ключа.
 */
export function wrapSecret(secret: Buffer, key: Buffer | null): string {
  if (!key) return secret.toString('base64');

  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const sealed = Buffer.concat([cipher.update(secret), cipher.final()]);
  return [iv, sealed, cipher.getAuthTag()]
    .map((part) => part.toString('base64url'))
    .join(SEPARATOR);
}

/**
 * Разворачивает секрет из базы.
 *
 * @remarks
 * Читает оба вида записи: и завёрнутую, и старую открытую. Иначе включение
 * мастер-ключа сделало бы неиграбельными все видео, залитые до него.
 */
export function unwrapSecret(stored: string, key: Buffer | null): Buffer {
  const parts = stored.split(SEPARATOR);
  if (parts.length !== PARTS) return Buffer.from(stored, 'base64');

  if (!key) {
    throw new Error('Секрет видео завёрнут, а VIDEO_MASTER_KEY не задан — развернуть нечем.');
  }

  const [iv, sealed, tag] = parts as [string, string, string];
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(sealed, 'base64url')), decipher.final()]);
}

/** Завёрнут ли уже: по этому признаку решают, нужно ли перезаворачивать. */
export function isWrapped(stored: string): boolean {
  return stored.split(SEPARATOR).length === PARTS;
}
