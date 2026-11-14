// @safe-bluegreen - миграция expand-only: колонки акции у позиции и цена без акции у строки заказа, прежняя версия их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offers\` ADD \`promo_price_micros\` numeric;`);
  await db.run(sql`ALTER TABLE \`offers\` ADD \`promo_until\` text;`);
  await db.run(sql`ALTER TABLE \`orders_lines\` ADD \`list_price_micros\` numeric;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`promo_price_micros\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`promo_until\`;`);
  await db.run(sql`ALTER TABLE \`orders_lines\` DROP COLUMN \`list_price_micros\`;`);
}
