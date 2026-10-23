// @safe-bluegreen - миграция expand-only: колонка названия пункта каталога в меню, прежняя версия её не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_menu_title\` text DEFAULT 'Магазин';`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_menu_title\`;`);
}
