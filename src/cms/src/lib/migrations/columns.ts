/**
 * Проверки схемы для миграций, которые идут по сайтам с разным набором таблиц.
 *
 * @remarks
 * Структура баз у сайтов расходится: таблицы блока есть там, где блок разрешили
 * ставить, а колонка могла прийти раньше собственной миграцией сайта. Слепая
 * операция по списку падает на первом расхождении и уносит с собой выкладку.
 *
 * Обычные миграции под новое поле этим не пользуются: там колонки заведомо нет,
 * и падение полезно - оно означает, что состояние базы разошлось с ожидаемым.
 */
import { sql } from '@payloadcms/db-sqlite';

/** Минимум от адаптера, который нужен здесь: выполнить запрос и прочитать ответ. */
interface Db {
  run: (query: unknown) => Promise<unknown>;
  all?: (query: unknown) => Promise<unknown>;
}

/** Строка ответа адаптера: из неё читаются имена таблиц и колонок. */
type Row = Record<string, unknown>;

/** Строки ответа адаптера: то массивом, то объектом с полем `rows` - зависит от метода чтения. */
function rowsOf(answer: unknown): ReadonlyArray<Row> {
  return Array.isArray(answer)
    ? (answer as ReadonlyArray<Row>)
    : ((answer as { rows?: ReadonlyArray<Row> } | undefined)?.rows ?? []);
}

/**
 * Есть ли такая таблица.
 *
 * @remarks
 * Таблицы блока появляются в базе там, где блок разрешили ставить, и набор
 * у сайтов разный. Операция по списку таблиц без этой проверки валит прогон
 * на первой недостающей, а с ним и выкладку.
 */
export async function hasTable(db: Db, table: string): Promise<boolean> {
  const read = db.all ?? db.run;
  const answer = await read.call(
    db,
    sql.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}' LIMIT 1;`),
  );
  return rowsOf(answer).length > 0;
}

/** Есть ли такая колонка у таблицы. */
export async function hasColumn(db: Db, table: string, column: string): Promise<boolean> {
  const read = db.all ?? db.run;
  const answer = await read.call(db, sql.raw(`PRAGMA table_info(\`${table}\`);`));

  return rowsOf(answer).some((row) => row['name'] === column);
}

/**
 * Добавить колонку, если её ещё нет.
 *
 * @remarks
 * Нужно догоняющим миграциям - тем, что подбирают структуру, придуманную
 * на сайте и позже уехавшую в шаблон. У таблиц есть `CREATE TABLE IF NOT EXISTS`,
 * у колонок такого в SQLite нет, поэтому наличие проверяется через `PRAGMA table_info`.
 *
 * @param definition - тип и умолчание, как в обычном `ADD`: `text DEFAULT '/privacy'`.
 */
export async function addColumnIfMissing(
  db: Db,
  table: string,
  column: string,
  definition: string,
): Promise<void> {
  if (await hasColumn(db, table, column)) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` ${definition};`));
}
