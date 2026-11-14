// @safe-bluegreen — миграция expand-only, безопасна в blue-green deploy
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`shop_checkout_phone_format\` text DEFAULT 'intl';`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_checkout_phone_format\`;`);
}
