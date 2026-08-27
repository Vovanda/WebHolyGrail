// @safe-bluegreen - колонки только добавляются, старый цвет их не читает
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/*
  Шаг секции переехал в настройки сайта: два значения, узкий экран и широкий.
  Пусто означает взять то, что задано в коде, поэтому колонки без умолчания.
*/

async function hasColumn(db: MigrateUpArgs['db'], table: string, column: string) {
  const rows = await db.all(sql.raw(`PRAGMA table_info(\`${table}\`)`));
  return (rows as Array<{ name: string }>).some((row) => row.name === column);
}

async function addIfMissing(db: MigrateUpArgs['db'], table: string, column: string) {
  if (await hasColumn(db, table, column)) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` text;`));
}

async function dropIfExists(db: MigrateDownArgs['db'], table: string, column: string) {
  if (!(await hasColumn(db, table, column))) return;
  await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`));
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addIfMissing(db, 'site_settings', 'block_space_narrow');
  await addIfMissing(db, 'site_settings', 'block_space_wide');
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await dropIfExists(db, 'site_settings', 'block_space_narrow');
  await dropIfExists(db, 'site_settings', 'block_space_wide');
}
