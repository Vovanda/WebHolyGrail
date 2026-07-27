// @safe-bluegreen — expand-only: новые таблицы картинок и новые колонки.
// Старый код их не знает и не читает, поэтому переживает switch без падений.
//
// Из авто-сгенерированного diff убраны table-recreation для articles_section и
// site_settings: drizzle подтянул туда накопленный дрейф дефолтов, к этой правке
// он отношения не имеет, а пересоздание таблиц на проде — лишний риск.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_feature_grid_items_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_feature_grid_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_items_images_order_idx\` ON \`pages_blocks_feature_grid_items_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_items_images_parent_id_idx\` ON \`pages_blocks_feature_grid_items_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_items_images_image_idx\` ON \`pages_blocks_feature_grid_items_images\` (\`image_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_feature_grid_items_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_feature_grid_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_items_images_order_idx\` ON \`_pages_v_blocks_feature_grid_items_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_items_images_parent_id_idx\` ON \`_pages_v_blocks_feature_grid_items_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_items_images_image_idx\` ON \`_pages_v_blocks_feature_grid_items_images\` (\`image_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_feature_grid_items_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_feature_grid_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_items_images_order_idx\` ON \`reusable_blocks_blocks_feature_grid_items_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_items_images_parent_id_idx\` ON \`reusable_blocks_blocks_feature_grid_items_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_items_images_image_idx\` ON \`reusable_blocks_blocks_feature_grid_items_images\` (\`image_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_feature_grid_items_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_feature_grid_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_items_images_order_idx\` ON \`_reusable_blocks_v_blocks_feature_grid_items_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_items_images_parent_id_idx\` ON \`_reusable_blocks_v_blocks_feature_grid_items_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_items_images_imag_idx\` ON \`_reusable_blocks_v_blocks_feature_grid_items_images\` (\`image_id\`);`,
  );

  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid_items\` ADD \`href\` text;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` ADD \`layout\` text DEFAULT 'grid';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid_items\` ADD \`href\` text;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` ADD \`layout\` text DEFAULT 'grid';`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid_items\` ADD \`href\` text;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` ADD \`layout\` text DEFAULT 'grid';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid_items\` ADD \`href\` text;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` ADD \`layout\` text DEFAULT 'grid';`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_feature_grid_items_images\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_feature_grid_items_images\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_feature_grid_items_images\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_feature_grid_items_images\`;`);

  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid_items\` DROP COLUMN \`href\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` DROP COLUMN \`layout\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid_items\` DROP COLUMN \`href\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` DROP COLUMN \`layout\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid_items\` DROP COLUMN \`href\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` DROP COLUMN \`layout\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid_items\` DROP COLUMN \`href\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` DROP COLUMN \`layout\`;`);
}
