// @safe-bluegreen - две новые колонки, у позиции со значением по умолчанию
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders_lines\` ADD \`mode\` text;`);
  await db.run(sql`ALTER TABLE \`offers\` ADD \`how_to_buy\` text DEFAULT 'cart' NOT NULL;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`orders_lines\` DROP COLUMN \`mode\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`how_to_buy\`;`);
}
