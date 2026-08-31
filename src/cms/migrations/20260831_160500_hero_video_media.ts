import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen - только добавление колонки, старый цвет её не читает.

/**
 * Видео обложки берётся из медиатеки.
 *
 * Прежде обложка знала лишь прямую ссылку на файл, и запись, загруженная
 * в медиатеку, ей была недоступна - вместе с нарезкой, которая готовится
 * к каждому загруженному видео. Ссылка остаётся рядом и работает как прежде.
 *
 * Колонка добавляется по факту: таблицы блока появляются в базе по мере того,
 * где его разрешили ставить, и на разных сайтах набор отличается. Слепой ALTER
 * по списку валит весь прогон на первой же недостающей таблице, а вместе с ним
 * и выкладку.
 */
const TABLES = [
  'pages_blocks_hero_cinematic',
  '_pages_v_blocks_hero_cinematic',
  'reusable_blocks_blocks_hero_cinematic',
  '_reusable_blocks_v_blocks_hero_cinematic',
  'specialists_blocks_hero_cinematic',
];

const COLUMN = 'video_id';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    if (await hasColumn(db, table, COLUMN)) continue;
    await db.run(
      sql.raw(`ALTER TABLE \`${table}\` ADD \`${COLUMN}\` integer REFERENCES media(id);`),
    );
    await db.run(
      sql.raw(`CREATE INDEX IF NOT EXISTS \`${table}_video_idx\` ON \`${table}\` (\`${COLUMN}\`);`),
    );
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    if (!(await hasColumn(db, table, COLUMN))) continue;
    await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_video_idx\`;`));
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
