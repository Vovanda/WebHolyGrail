// @safe-bluegreen - миграция удаляет колонки и таблицу, это не expand-only. Безопасна, потому что
// таблиц магазина на проде ещё нет: они приходят этой же веткой, прежняя версия их не читает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`invoices_codes\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_offers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`price_micros\` numeric,
  	\`stock\` numeric,
  	\`deposit_micros\` numeric,
  	\`how_to_buy\` text DEFAULT 'cart' NOT NULL,
  	\`image_id\` integer,
  	\`summary\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_offers\`("id", "title", "price_micros", "stock", "deposit_micros", "how_to_buy", "image_id", "summary", "updated_at", "created_at") SELECT "id", "title", "price_micros", "stock", "deposit_micros", "how_to_buy", "image_id", "summary", "updated_at", "created_at" FROM \`offers\`;`,
  );
  await db.run(sql`DROP TABLE \`offers\`;`);
  await db.run(sql`ALTER TABLE \`__new_offers\` RENAME TO \`offers\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`offers_image_idx\` ON \`offers\` (\`image_id\`);`);
  await db.run(sql`CREATE INDEX \`offers_updated_at_idx\` ON \`offers\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`offers_created_at_idx\` ON \`offers\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`__new_orders_lines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`offer_id\` integer,
  	\`title\` text NOT NULL,
  	\`quantity\` numeric NOT NULL,
  	\`price_micros\` numeric NOT NULL,
  	\`sum_micros\` numeric,
  	\`deposit_micros\` numeric,
  	\`mode\` text,
  	FOREIGN KEY (\`offer_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_orders_lines\`("_order", "_parent_id", "id", "offer_id", "title", "quantity", "price_micros", "sum_micros", "deposit_micros", "mode") SELECT "_order", "_parent_id", "id", "offer_id", "title", "quantity", "price_micros", "sum_micros", "deposit_micros", "mode" FROM \`orders_lines\`;`,
  );
  await db.run(sql`DROP TABLE \`orders_lines\`;`);
  await db.run(sql`ALTER TABLE \`__new_orders_lines\` RENAME TO \`orders_lines\`;`);
  await db.run(sql`CREATE INDEX \`orders_lines_order_idx\` ON \`orders_lines\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`orders_lines_parent_id_idx\` ON \`orders_lines\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`orders_lines_offer_idx\` ON \`orders_lines\` (\`offer_id\`);`);
  await db.run(sql`CREATE TABLE \`__new_invoices_lines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`offer_id\` integer,
  	\`title\` text NOT NULL,
  	\`quantity\` numeric NOT NULL,
  	\`price_micros\` numeric NOT NULL,
  	\`sum_micros\` numeric,
  	FOREIGN KEY (\`offer_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_invoices_lines\`("_order", "_parent_id", "id", "offer_id", "title", "quantity", "price_micros", "sum_micros") SELECT "_order", "_parent_id", "id", "offer_id", "title", "quantity", "price_micros", "sum_micros" FROM \`invoices_lines\`;`,
  );
  await db.run(sql`DROP TABLE \`invoices_lines\`;`);
  await db.run(sql`ALTER TABLE \`__new_invoices_lines\` RENAME TO \`invoices_lines\`;`);
  await db.run(sql`CREATE INDEX \`invoices_lines_order_idx\` ON \`invoices_lines\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`invoices_lines_parent_id_idx\` ON \`invoices_lines\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_lines_offer_idx\` ON \`invoices_lines\` (\`offer_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`invoices_codes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` numeric,
  	\`code_id\` text,
  	\`code\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`invoices_codes_order_idx\` ON \`invoices_codes\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`invoices_codes_parent_id_idx\` ON \`invoices_codes\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`offers\` ADD \`access_id\` integer REFERENCES media_accesses(id);`,
  );
  await db.run(sql`CREATE INDEX \`offers_access_idx\` ON \`offers\` (\`access_id\`);`);
  await db.run(
    sql`ALTER TABLE \`orders_lines\` ADD \`access_id\` integer REFERENCES media_accesses(id);`,
  );
  await db.run(sql`CREATE INDEX \`orders_lines_access_idx\` ON \`orders_lines\` (\`access_id\`);`);
  await db.run(
    sql`ALTER TABLE \`invoices_lines\` ADD \`access_id\` integer REFERENCES media_accesses(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_lines_access_idx\` ON \`invoices_lines\` (\`access_id\`);`,
  );
}
