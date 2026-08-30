/**
 * Разворот закрытого снимка базы.
 *
 * @remarks
 * Снимок зашифрованной базы лежит закрытым тем же ключом, что и сама база
 * (см. `backup-db.ts`). Чтобы в него заглянуть - проверить целость, поднять
 * копию сайта, достать потерянную запись, - его надо открыть.
 *
 * Отдельный скрипт, а не признак у снимающего: снимают каждую ночь без
 * присмотра, а открывают руками и по случаю.
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms open:backup /opt/backups/db/site.db.enc /tmp/site.db
 * ```
 *
 * Открытая копия читается обычным `sqlite3` - и её же надо стереть, когда
 * разбор закончен: это те же данные, только без замка.
 */
import { createDecipheriv, createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync, statSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const MAGIC = Buffer.from('WHGBAK01');
const IV_BYTES = 12;
const TAG_BYTES = 16;

async function main(): Promise<void> {
  const [from, to] = process.argv.slice(2);
  if (!from || !to) {
    console.error('Нужны два довода: что открыть и куда положить.');
    process.exit(1);
  }
  if (!existsSync(from)) {
    console.error(`Снимок не найден: ${from}`);
    process.exit(1);
  }

  const key = process.env['DATABASE_ENCRYPTION_KEY'] ?? '';
  if (!key) {
    console.error('Ключ не задан: открывать нечем. Проверьте DATABASE_ENCRYPTION_KEY.');
    process.exit(1);
  }

  const head = readFileSync(from).subarray(0, MAGIC.length + IV_BYTES);
  if (!head.subarray(0, MAGIC.length).equals(MAGIC)) {
    console.error('Это не наш снимок: метки формата нет.');
    process.exit(1);
  }

  const iv = head.subarray(MAGIC.length);
  const total = statSync(from).size;
  const bodyStart = MAGIC.length + IV_BYTES;
  const bodyEnd = total - TAG_BYTES - 1;
  const tag = readFileSync(from).subarray(total - TAG_BYTES);

  const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(key).digest(), iv);
  decipher.setAuthTag(tag);

  await pipeline(
    createReadStream(from, { start: bodyStart, end: bodyEnd }),
    decipher,
    createWriteStream(to),
  );
  console.log(`снимок открыт: ${to}`);
}

main().catch((error: unknown) => {
  // Подпись не сошлась - значит файл побит или ключ не тот. Дальше не идём:
  // половина базы хуже честного отказа.
  console.error('открыть не вышло:', error instanceof Error ? error.message : error);
  process.exit(1);
});
