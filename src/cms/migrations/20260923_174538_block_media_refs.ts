import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen - колонка добавляется, обязательность снимается; старый цвет пишет то же, что писал.

/**
 * Баннер и фото цитаты берутся из медиатеки.
 *
 * Прежде оба блока знали только внешний адрес картинки. Из адреса не узнать
 * ни ступеней нарезки, ни формы кадра, ни заготовки - такой баннер тянул
 * исходный файл целиком на любую ширину экрана. Адрес остаётся рядом и
 * работает как прежде: страницы, собранные на нём, не должны погаснуть.
 *
 * Таблицы ищутся по окончанию имени, а не перечисляются: блок ставят там, где
 * его разрешили, и набор коллекций у каждого сайта свой. Слепой ALTER по списку
 * валит весь прогон на первой недостающей таблице, а с ним и выкладку.
 *
 * Обязательность с прежней колонки снимается там, где она стоит: запись, у
 * которой заполнена только связь с медиатекой, иначе не сохраняется вовсе.
 * SQLite умеет это лишь пересборкой таблицы, поэтому она делается точечно -
 * только для тех таблиц, где ограничение действительно осталось.
 */
const LINKS = [
  {
    ending: 'blocks_banner_slider_banners',
    column: 'image_id',
    index: 'image_idx',
    legacy: 'image_url',
  },
  {
    ending: 'blocks_quote_photo_urls',
    column: 'file_id',
    index: 'file_idx',
    legacy: 'url',
  },
] as const;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const link of LINKS) {
    for (const table of await tablesEndingWith(db, link.ending)) {
      await dropNotNull(db, table, link.legacy);
      if (await hasColumn(db, table, link.column)) continue;
      await db.run(
        sql.raw(`ALTER TABLE \`${table}\` ADD \`${link.column}\` integer REFERENCES media(id);`),
      );
      await db.run(
        sql.raw(
          `CREATE INDEX IF NOT EXISTS \`${table}_${link.index}\` ON \`${table}\` (\`${link.column}\`);`,
        ),
      );
    }
  }
}

/**
 * Откат снимает только связь с медиатекой.
 *
 * @remarks
 * Обязательность прежней колонки не возвращается: к этому времени в ней могут
 * стоять пустые значения у записей, где картинка взята из медиатеки, и запрет
 * на пустое сделал бы таблицу нечитаемой.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const link of LINKS) {
    for (const table of await tablesEndingWith(db, link.ending)) {
      if (!(await hasColumn(db, table, link.column))) continue;
      await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_${link.index}\`;`));
      await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${link.column}\`;`));
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function tablesEndingWith(db: any, ending: string): Promise<readonly string[]> {
  const found = await db.run(
    sql.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%${ending}';`),
  );
  const rows = (found?.rows ?? []) as ReadonlyArray<{ name?: string }>;
  return rows.map((row) => row.name).filter((name): name is string => Boolean(name));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function hasColumn(db: any, table: string, column: string): Promise<boolean> {
  return (await columnsOf(db, table)).some((found) => found.name === column);
}

interface ColumnInfo {
  readonly name?: string;
  readonly notnull?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function columnsOf(db: any, table: string): Promise<readonly ColumnInfo[]> {
  const info = await db.run(sql.raw(`PRAGMA table_info(\`${table}\`);`));
  return (info?.rows ?? []) as ReadonlyArray<ColumnInfo>;
}

/**
 * Снимает запрет на пустое значение у одной колонки.
 *
 * @remarks
 * Отдельной команды для этого в SQLite нет: таблица собирается заново по своему
 * же описанию, данные переливаются, а указатели создаются повторно - вместе
 * с таблицей они уходят. Описание берётся из самой базы, поэтому связи
 * и ключи остаются те же, что были.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function dropNotNull(db: any, table: string, column: string): Promise<void> {
  const columns = await columnsOf(db, table);
  const target = columns.find((found) => found.name === column);
  if (!target || !target.notnull) return;

  const create = await tableDdl(db, table);
  if (!create) return;

  const relaxed = withoutNotNull(create, column);
  if (relaxed === create) return;

  const temporary = `__relax_${table}`;
  const names = columns
    .map((found) => found.name)
    .filter((name): name is string => Boolean(name))
    .map((name) => `\`${name}\``)
    .join(', ');
  const indexes = await indexDdls(db, table);

  await db.run(sql.raw(relaxed.replace(`\`${table}\``, `\`${temporary}\``)));
  await db.run(
    sql.raw(`INSERT INTO \`${temporary}\` (${names}) SELECT ${names} FROM \`${table}\`;`),
  );
  await db.run(sql.raw(`DROP TABLE \`${table}\`;`));
  await db.run(sql.raw(`ALTER TABLE \`${temporary}\` RENAME TO \`${table}\`;`));
  for (const index of indexes) await db.run(sql.raw(index));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function tableDdl(db: any, table: string): Promise<string | null> {
  const found = await db.run(
    sql.raw(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}' LIMIT 1;`),
  );
  const rows = (found?.rows ?? []) as ReadonlyArray<{ sql?: string }>;
  return rows[0]?.sql ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function indexDdls(db: any, table: string): Promise<readonly string[]> {
  const found = await db.run(
    sql.raw(
      `SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='${table}' AND sql IS NOT NULL;`,
    ),
  );
  const rows = (found?.rows ?? []) as ReadonlyArray<{ sql?: string }>;
  return rows.map((row) => row.sql).filter((text): text is string => Boolean(text));
}

/** Убирает `NOT NULL` из описания одной колонки, не тронув остальные. */
export function withoutNotNull(create: string, column: string): string {
  const pattern = new RegExp(`(\`${column}\`[^,\\n]*?)\\s+NOT NULL`, 'i');
  return create.replace(pattern, '$1');
}
