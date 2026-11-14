// @safe-bluegreen - новые колонки настроек магазина с умолчаниями
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_payee_name\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_payee_inn\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_payee_bik\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_payee_account\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_payee_corr_account\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_payee_bank\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_sbp_phone\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_sbp_bank\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_card\` text;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`shop_order_hold_hours\` numeric DEFAULT 72;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`shop_invoice_due_days\` numeric DEFAULT 3;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`shop_checkout_phone\` text DEFAULT 'optional';`,
  );
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`shop_checkout_email\` text DEFAULT 'optional';`,
  );
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`shop_checkout_comment\` integer DEFAULT true;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_payee_name\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_payee_inn\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_payee_bik\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_payee_account\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_payee_corr_account\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_payee_bank\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_sbp_phone\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_sbp_bank\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_card\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_order_hold_hours\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_invoice_due_days\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_checkout_phone\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_checkout_email\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`shop_checkout_comment\`;`);
}
