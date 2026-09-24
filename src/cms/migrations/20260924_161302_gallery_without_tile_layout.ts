// @safe-bluegreen - блок галереи появился в той же невыложенной серии: старый цвет её таблиц не знает
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { addColumnIfMissing, hasColumn, hasTable } from '../src/lib/migrations/columns';

/**
 * У галереи нет раскладки плиток.
 *
 * Поля попали к ней по ошибке, вместе с общей обёрткой: плитку галереи рисует
 * AspectRows по формам снимков, фигура из ячеек к ней не применяется. Данных
 * в колонках у сайтов нет - блок выходит вместе с этой миграцией.
 *
 * Каждая операция по факту: таблицы блока есть там, где его разрешили ставить.
 */
const TABLES = [
  'pages_blocks_gallery',
  '_pages_v_blocks_gallery',
  'reusable_blocks_blocks_gallery',
  '_reusable_blocks_v_blocks_gallery',
  'specialists_blocks_gallery',
];
const COLUMNS = ['tile_layout', 'tile_layout_md', 'tile_layout_sm'];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    for (const column of COLUMNS) {
      if (!(await hasColumn(db, table, column))) continue;
      await db.run(sql.raw(`ALTER TABLE \`${table}\` DROP COLUMN \`${column}\`;`));
    }
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    for (const column of COLUMNS) await addColumnIfMissing(db, table, column, 'text');
  }
}
