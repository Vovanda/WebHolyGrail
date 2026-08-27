import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen - только добавление колонки, старый код её не видит.

/**
 * Поле «канал» у блока карусели: из него лента берёт видео автора.
 *
 * Колонка добавляется по факту: таблицы блока появляются в базе по мере того,
 * где его разрешили ставить, и на разных сайтах набор отличается. Слепой ALTER
 * по списку валит весь прогон на первой же недостающей таблице, а вместе с ним
 * и выкладку.
 */
const TABLES = [
  'pages_blocks_carousel',
  '_pages_v_blocks_carousel',
  'reusable_blocks_blocks_carousel',
  '_reusable_blocks_v_blocks_carousel',
  'specialists_blocks_carousel',
];

const COLUMN = 'source_channel';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function hasTable(db: any, table: string): Promise<boolean> {
  const found = await db.run(
    sql.raw(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}' LIMIT 1;`),
  );
  return (found?.rows?.length ?? 0) > 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function hasColumn(db: any, table: string, column: string): Promise<boolean> {
  const info = await db.run(sql.raw(`PRAGMA table_info(\`${table}\`);`));
  const rows = (info?.rows ?? []) as ReadonlyArray<{ name?: string }>;
  return rows.some((row) => row.name === column);
}
