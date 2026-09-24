// @safe-bluegreen - колонка только добавляется, старый цвет её не читает
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { addColumnIfMissing, hasColumn } from '../src/lib/migrations/columns';

/**
 * Ширина колонки блога в настройках сайта.
 *
 * Умолчание - ширина страницы: блог и страницы сайта читаются одной вёрсткой.
 * Значение ложится и в уже заведённую строку настроек, так что живой сайт
 * после выкладки идёт шириной страницы, пока владелец не выберет другую.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'site_settings', 'blog_column_width', "text DEFAULT 'page'");
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  if (!(await hasColumn(db, 'site_settings', 'blog_column_width'))) return;
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`blog_column_width\`;`);
}
