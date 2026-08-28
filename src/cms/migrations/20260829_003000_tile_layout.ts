// @safe-bluegreen - колонка только добавляется, старый цвет её не читает
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/*
  Раскладка плиток именами областей: «a b c e : a b d d». Записей три, по ширинам
  окна - большой экран, средний, малый. Пусто означает, что фигура на этой ширине
  считается сама, поэтому колонки без умолчания.

  Поле стоит у сетки фич, секции статей и списка документов. Каждый блок лежит
  в нескольких коллекциях, у каждой своя таблица, плюс теневые таблицы черновиков -
  колонка добавляется во все. Забыть хоть одну нельзя: Payload падает на чтении
  коллекции целиком, а не только на этом блоке.
*/

const TABLES = [
  'pages_blocks_feature_grid',
  '_pages_v_blocks_feature_grid',
  'reusable_blocks_blocks_feature_grid',
  '_reusable_blocks_v_blocks_feature_grid',
  'specialists_blocks_feature_grid',
  'pages_blocks_articles_section',
  '_pages_v_blocks_articles_section',
  'reusable_blocks_blocks_articles_section',
  '_reusable_blocks_v_blocks_articles_section',
  'specialists_blocks_articles_section',
  'pages_blocks_document_list',
  '_pages_v_blocks_document_list',
  'reusable_blocks_blocks_document_list',
  '_reusable_blocks_v_blocks_document_list',
  'specialists_blocks_document_list',
];

const COLUMNS = ['tile_layout', 'tile_layout_md', 'tile_layout_sm'];

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
    for (const column of COLUMNS) {
      if (await hasColumn(db, table, column)) continue;
      await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD \`${column}\` text;`));
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    for (const column of COLUMNS) {
      if (!(await hasColumn(db, table, column))) continue;
      await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`));
    }
  }
}
