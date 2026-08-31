/**
 * Подготовка базы к миграции: журнал и ожидание блокировки.
 *
 * @remarks
 * При сине-зелёной выкладке базу в момент миграции держат сразу трое: старый
 * цвет принимает посетителей, новый уже поднят, а сам `payload migrate` идёт
 * третьим соединением. В журнале `delete` любая запись требует исключительного
 * доступа, и первая же `ALTER TABLE` падает с `SQLITE_BUSY`, откатывая выкладку.
 *
 * Журнал `WAL` разводит читающих и пишущего: миграция меняет схему, пока сайт
 * продолжает отвечать. Режим - свойство файла базы, он сохраняется и после
 * перезапуска, поэтому переключение делается один раз и дальше только сверяется.
 *
 * Ожидание блокировки задаётся на соединение, а не на файл, и потому ставится
 * при каждом запуске: без него встречная запись отвергается мгновенно, вместо
 * того чтобы подождать освобождения.
 *
 * Запускается перед `payload migrate` - см. `migrate` в `package.json`.
 * Повторный запуск ничего не меняет.
 */
import { existsSync } from 'node:fs';

import Database from 'libsql';

/** Сколько ждать освобождения базы, прежде чем признать её занятой. */
const BUSY_TIMEOUT_MS = 15_000;

function sourceFromEnv(): string {
  const uri = process.env['DATABASE_URI'] ?? '';
  return uri.startsWith('file:') ? uri.slice('file:'.length) : uri;
}

/** Текущий режим журнала. Ответ приходит строкой в поле того же имени. */
function journalMode(db: InstanceType<typeof Database>): string {
  const rows = db.pragma('journal_mode') as ReadonlyArray<{ journal_mode?: string }>;
  return String(rows[0]?.journal_mode ?? '').toLowerCase();
}

function main(): void {
  const source = sourceFromEnv();
  if (!source || !existsSync(source)) {
    // Базы ещё нет - её создаст сама миграция, и готовить нечего.
    console.log(`подготовка базы: файла нет (${source || 'DATABASE_URI пуст'}), пропускаю`);
    return;
  }

  const key = process.env['DATABASE_ENCRYPTION_KEY'];
  type OpenOptions = ConstructorParameters<typeof Database>[1] & { encryptionKey?: string };
  const db = new Database(source, (key ? { encryptionKey: key } : {}) as OpenOptions);

  try {
    db.pragma(`busy_timeout = ${BUSY_TIMEOUT_MS}`);

    const before = journalMode(db);
    if (before !== 'wal') {
      db.pragma('journal_mode = WAL');
    }
    const after = journalMode(db);

    console.log(
      `подготовка базы: журнал ${after}` +
        (before === after ? ' (был уже такой)' : ` (был ${before})`) +
        `, ожидание блокировки ${BUSY_TIMEOUT_MS} мс`,
    );

    if (after !== 'wal') {
      console.error('журнал перевести не удалось: миграция может упасть на занятой базе');
      process.exitCode = 1;
    }
  } finally {
    db.close();
  }
}

main();
