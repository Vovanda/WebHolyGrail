// @safe-bluegreen - колонка только добавляется, старый цвет её не читает
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/*
  Раскладка плиток именами областей: «a b c e : a b d d». Пусто означает, что
  фигура считается сама, поэтому колонка без умолчания.

  Блок сетки лежит в нескольких коллекциях и у каждой своя таблица, плюс теневые
  таблицы черновиков - колонка добавляется во все, иначе поле пропадёт там, где
  его забыли.
*/

const TABLES = [
  'pages_blocks_feature_grid',
  '_pages_v_blocks_feature_grid',
  'reusable_blocks_blocks_feature_grid',
  '_reusable_blocks_v_blocks_feature_grid',
  'specialists_blocks_feature_grid',
];

const COLUMN = 'tile_layout';

async function hasTable(db: MigrateUpArgs['db'], table: string) {
  const rows = await db.all(
    sql.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`),
  );
  return (rows as Array<{ name: string }>).length > 0;
}

async function hasColumn(db: MigrateUpArgs['db'], table: string, column: string) {
  const rows = await db.all(sql.raw(`PRAGMA table_info(\`${table}\`)`));
  return (rows as Array<{ name: string }>).some((row) => row.name === column);
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    if (await hasColumn(db, table, COLUMN)) continue;
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${COLUMN}\` text;`));
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    if (!(await hasColumn(db, table, COLUMN))) continue;
    await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${COLUMN}\`;`));
  }
}
