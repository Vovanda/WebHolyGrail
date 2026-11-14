// @safe-bluegreen - три новые колонки брони и назначения счёта
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders_lines\` ADD \`deposit_micros\` numeric;`);
  await db.run(sql`ALTER TABLE \`invoices\` ADD \`purpose\` text DEFAULT 'payment';`);
  await db.run(sql`ALTER TABLE \`offers\` ADD \`deposit_micros\` numeric;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders_lines\` DROP COLUMN \`deposit_micros\`;`);
  await db.run(sql`ALTER TABLE \`invoices\` DROP COLUMN \`purpose\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`deposit_micros\`;`);
}
