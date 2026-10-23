// @safe-bluegreen - миграция expand-only: новая колонка с умолчанием, прежняя версия сайта её не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_cart_href\` text DEFAULT '/cart';`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_cart_href\`;`);
}
