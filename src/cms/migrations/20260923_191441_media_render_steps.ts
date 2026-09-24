import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen - только добавление колонок, старый цвет их не читает.

/**
 * У картинки выбирается размер на странице и при открытии.
 *
 * Показ берёт ступень под место сам, но про снимок владелец знает больше: общий
 * план читается и мелким, а весит втрое меньше. Пустое значение ничего не меняет.
 */
const COLUMNS = ['page_step', 'lane_step'];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const column of COLUMNS) {
    if (await hasColumn(db, column)) continue;
    await db.run(sql.raw(`ALTER TABLE \`media\` ADD \`${column}\` text;`));
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const column of COLUMNS) {
    if (!(await hasColumn(db, column))) continue;
    await db.run(sql.raw(`ALTER TABLE \`media\` DROP COLUMN \`${column}\`;`));
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- тип соединения задан библиотекой
async function hasColumn(db: any, column: string): Promise<boolean> {
  const info = await db.run(sql.raw('PRAGMA table_info(`media`);'));
  const rows = (info?.rows ?? []) as ReadonlyArray<{ name?: string }>;
  return rows.some((row) => row.name === column);
}
