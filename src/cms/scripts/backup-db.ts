/**
 * Снимок базы сайта - целой копией, на ходу.
 *
 * @remarks
 * Внешний `sqlite3` берёт не всякую базу: если сайт держит её зашифрованной,
 * ключ знает только он сам, и снаружи файл не открыть вовсе. Поэтому снимок
 * делает сайт - отсюда и этот скрипт.
 *
 * Копия снимается через `VACUUM INTO`: он пишет целую базу, не останавливая
 * сайт и не рискуя поймать её посреди записи. Простое копирование файла такой
 * гарантии не даёт - рядом лежит журнал, и копия без него бесполезна.
 *
 * **Копия зашифрованной базы выходит открытой.** Проверено: `VACUUM INTO`
 * снимает шифрование, и такой снимок читается без ключа. Класть его рядом
 * с базой значит свести защиту на нет, поэтому копия шифруется здесь же тем
 * же ключом, а открытый временный файл удаляется.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms backup:db /opt/backups/db/site-20260830.db
 * ```
 *
 * У незашифрованной базы получается обычный файл, у зашифрованной - он же
 * с припиской `.enc`. Как развернуть - в `DEPLOY.md`.
 */
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { pipeline } from 'node:stream/promises';

import Database from 'libsql';

/** Метка формата: по ней разворачивающий видит, чем файл закрыт. */
const MAGIC = Buffer.from('WHGBAK01');

async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) {
    console.error('Куда класть снимок - первым доводом. Пример: backup:db /opt/backups/db/site.db');
    process.exit(1);
  }

  const uri = process.env['DATABASE_URI'] ?? '';
  const source = uri.replace(/^file:/, '');
  if (!source || !existsSync(source)) {
    console.error(`База не найдена: ${source || '(DATABASE_URI пуст)'}`);
    process.exit(1);
  }

  const key = process.env['DATABASE_ENCRYPTION_KEY'] ?? '';

  /*
    Ключ шифрования библиотека принимает, а в её описании типов его нет -
    отсюда приведение. Тот же приём и в конфиге Payload, где база открывается
    на каждом старте.
  */
  type OpenOptions = ConstructorParameters<typeof Database>[1] & { encryptionKey?: string };
  const db = new Database(source, (key ? { encryptionKey: key } : {}) as OpenOptions);

  // Снимок пишется рядом с целью и только потом занимает её место: оборванный
  // прогон иначе оставил бы обрезанный файл под именем готовой копии.
  const draft = `${target}.part`;
  if (existsSync(draft)) rmSync(draft);
  db.exec(`VACUUM INTO '${draft.replace(/\\/g, '/')}'`);

  if (!key) {
    renameOver(draft, target);
    console.log(`снимок готов: ${target} (${size(target)})`);
    return;
  }

  await sealFile(draft, `${target}.enc`, key);
  rmSync(draft);
  console.log(`снимок готов и закрыт ключом: ${target}.enc (${size(`${target}.enc`)})`);
}

/**
 * Закрывает файл тем же ключом, которым закрыта сама база.
 *
 * @remarks
 * AES-256-GCM: он же и подделку ловит - испорченная копия даст ошибку при
 * развороте, а не мусор вместо базы. Ключ приводится к 32 байтам хешем:
 * в настройке он строкой произвольной длины.
 */
async function sealFile(from: string, to: string, key: string): Promise<void> {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(key).digest(), iv);
  const out = createWriteStream(to);

  out.write(MAGIC);
  out.write(iv);
  await pipeline(createReadStream(from), cipher, out, { end: false });
  out.end(cipher.getAuthTag());
}

function renameOver(from: string, to: string): void {
  if (existsSync(to)) rmSync(to);
  renameSync(from, to);
}

function size(path: string): string {
  const bytes = statSync(path).size;
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.round(bytes / 1024)} КБ`;
}

main().catch((error: unknown) => {
  console.error('снимок не вышел:', error instanceof Error ? error.message : error);
  process.exit(1);
});
