/**
 * Добавление колонки, которая на сайте может уже быть.
 *
 * @remarks
 * Нужно догоняющим миграциям - тем, что подбирают структуру, придуманную
 * когда-то на сайте и позже уехавшую в шаблон. Миграцию сайта убирают как
 * дубликат, но у него самого колонка уже создана, и обычный `ALTER TABLE ADD`
 * валит весь прогон, а вместе с ним выкладку.
 *
 * У таблиц есть `CREATE TABLE IF NOT EXISTS`, у колонок такого в SQLite нет,
 * поэтому наличие проверяется через `PRAGMA table_info`.
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

/** Есть ли такая колонка у таблицы. */
export async function hasColumn(db: Db, table: string, column: string): Promise<boolean> {
  const read = db.all ?? db.run;
  const answer = (await read.call(db, sql.raw(`PRAGMA table_info(\`${table}\`);`))) as
    | { rows?: ReadonlyArray<Record<string, unknown>> }
    | ReadonlyArray<Record<string, unknown>>
    | undefined;

  const rows = Array.isArray(answer) ? answer : (answer?.rows ?? []);
  return rows.some((row) => row['name'] === column);
}

/**
 * Добавить колонку, если её ещё нет.
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
