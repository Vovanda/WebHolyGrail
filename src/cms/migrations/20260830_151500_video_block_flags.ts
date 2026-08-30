// @safe-bluegreen — добавляются колонки, прежний код их не читает.
//
// У блока видео появляются флажки показа: название и описание берутся у самой
// записи, а блок только решает, показывать их или нет. Прежние поля подписи
// остаются на месте - у сайтов в них лежит текст, и убирать его молча нельзя.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Где блок разрешён, там и таблица.
 *
 * @remarks
 * Набор отличается от сайта к сайту: слепой `ALTER TABLE` по списку валит весь
 * прогон на первой недостающей таблице, а с ним и выкладку.
 */
const TABLES = [
  'pages_blocks_video',
  '_pages_v_blocks_video',
  'reusable_blocks_blocks_video',
  '_reusable_blocks_v_blocks_video',
  'specialists_blocks_video',
];

const COLUMNS: ReadonlyArray<{ name: string; ddl: string }> = [
  // Название показываем по умолчанию: раньше подпись стояла над кадром, и её
  // пропажа читалась бы как поломка страницы.
  { name: 'show_title', ddl: 'ADD `show_title` integer DEFAULT true' },
  { name: 'show_description', ddl: 'ADD `show_description` integer DEFAULT false' },
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    for (const column of COLUMNS) {
      if (await hasColumn(db, table, column.name)) continue;
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ${column.ddl};`));
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    for (const column of COLUMNS) {
      if (!(await hasColumn(db, table, column.name))) continue;
      await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column.name}\`;`));
    }
  }
}

async function hasTable(db: MigrateUpArgs['db'], table: string): Promise<boolean> {
  const rows = await db.all(
    sql.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`),
  );
  return (rows as unknown[]).length > 0;
}

async function hasColumn(db: MigrateUpArgs['db'], table: string, column: string): Promise<boolean> {
  const rows = await db.all(sql.raw(`PRAGMA table_info(\`${table}\`)`));
  return (rows as Array<{ name: string }>).some((row) => row.name === column);
}
