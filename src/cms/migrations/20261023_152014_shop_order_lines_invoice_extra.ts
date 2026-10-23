// @safe-bluegreen - миграция expand-only: новая таблица добавленных строк счёта и две колонки причин, прежняя версия их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`invoices_extra_lines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'charge' NOT NULL,
  	\`offer_id\` integer,
  	\`title\` text,
  	\`quantity\` numeric DEFAULT 1,
  	\`price_micros\` numeric,
  	\`sum_micros\` numeric,
  	\`applies_to_id\` integer,
  	FOREIGN KEY (\`offer_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`applies_to_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`invoices_extra_lines_order_idx\` ON \`invoices_extra_lines\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_extra_lines_parent_id_idx\` ON \`invoices_extra_lines\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_extra_lines_offer_idx\` ON \`invoices_extra_lines\` (\`offer_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_extra_lines_applies_to_idx\` ON \`invoices_extra_lines\` (\`applies_to_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`orders_lines\` ADD \`removed_reason\` text;`);
  await db.run(sql`ALTER TABLE \`invoices\` ADD \`void_reason\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`invoices_extra_lines\`;`);
  await db.run(sql`ALTER TABLE \`orders_lines\` DROP COLUMN \`removed_reason\`;`);
  await db.run(sql`ALTER TABLE \`invoices\` DROP COLUMN \`void_reason\`;`);
}
