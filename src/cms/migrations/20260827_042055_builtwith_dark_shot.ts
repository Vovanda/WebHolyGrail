import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_built_with_items\` ADD \`screenshot_dark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_screenshot_dark_idx\` ON \`pages_blocks_built_with_items\` (\`screenshot_dark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_built_with_items\` ADD \`screenshot_dark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_screenshot_dark_idx\` ON \`_pages_v_blocks_built_with_items\` (\`screenshot_dark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with_items\` ADD \`screenshot_dark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_screenshot_dark_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`screenshot_dark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with_items\` ADD \`screenshot_dark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_screenshot_da_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`screenshot_dark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_built_with_items\` ADD \`screenshot_dark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_screenshot_dark_idx\` ON \`specialists_blocks_built_with_items\` (\`screenshot_dark_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_built_with_items\`("_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id") SELECT "_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id" FROM \`pages_blocks_built_with_items\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_built_with_items\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_built_with_items\` RENAME TO \`pages_blocks_built_with_items\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_order_idx\` ON \`pages_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_parent_id_idx\` ON \`pages_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_screenshot_idx\` ON \`pages_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_built_with_items\`("_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id", "_uuid") SELECT "_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id", "_uuid" FROM \`_pages_v_blocks_built_with_items\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_built_with_items\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_built_with_items\` RENAME TO \`_pages_v_blocks_built_with_items\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_order_idx\` ON \`_pages_v_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_parent_id_idx\` ON \`_pages_v_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_screenshot_idx\` ON \`_pages_v_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_built_with_items\`("_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id") SELECT "_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id" FROM \`reusable_blocks_blocks_built_with_items\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_built_with_items\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_built_with_items\` RENAME TO \`reusable_blocks_blocks_built_with_items\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_order_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_parent_id_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_screenshot_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_built_with_items\`("_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id", "_uuid") SELECT "_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id", "_uuid" FROM \`_reusable_blocks_v_blocks_built_with_items\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_built_with_items\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_built_with_items\` RENAME TO \`_reusable_blocks_v_blocks_built_with_items\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_order_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_screenshot_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_specialists_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`site_name\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_specialists_blocks_built_with_items\`("_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id") SELECT "_order", "_parent_id", "id", "site_name", "url", "niche", "screenshot_id" FROM \`specialists_blocks_built_with_items\`;`,
  );
  await db.run(sql`DROP TABLE \`specialists_blocks_built_with_items\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_specialists_blocks_built_with_items\` RENAME TO \`specialists_blocks_built_with_items\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_order_idx\` ON \`specialists_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_parent_id_idx\` ON \`specialists_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_screenshot_idx\` ON \`specialists_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
}
