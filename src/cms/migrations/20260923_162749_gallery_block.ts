// @safe-bluegreen - создаются только новые таблицы блока, старый цвет их не знает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_gallery_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`caption\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_gallery_items_order_idx\` ON \`pages_blocks_gallery_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_gallery_items_parent_id_idx\` ON \`pages_blocks_gallery_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_gallery_items_file_idx\` ON \`pages_blocks_gallery_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`view\` text DEFAULT 'tiles',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_gallery_order_idx\` ON \`pages_blocks_gallery\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_gallery_parent_id_idx\` ON \`pages_blocks_gallery\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_gallery_path_idx\` ON \`pages_blocks_gallery\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_gallery_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_gallery_items_order_idx\` ON \`_pages_v_blocks_gallery_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_gallery_items_parent_id_idx\` ON \`_pages_v_blocks_gallery_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_gallery_items_file_idx\` ON \`_pages_v_blocks_gallery_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`view\` text DEFAULT 'tiles',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_gallery_order_idx\` ON \`_pages_v_blocks_gallery\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_gallery_parent_id_idx\` ON \`_pages_v_blocks_gallery\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_gallery_path_idx\` ON \`_pages_v_blocks_gallery\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_gallery_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`caption\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_gallery_items_order_idx\` ON \`reusable_blocks_blocks_gallery_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_gallery_items_parent_id_idx\` ON \`reusable_blocks_blocks_gallery_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_gallery_items_file_idx\` ON \`reusable_blocks_blocks_gallery_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`view\` text DEFAULT 'tiles',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_gallery_order_idx\` ON \`reusable_blocks_blocks_gallery\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_gallery_parent_id_idx\` ON \`reusable_blocks_blocks_gallery\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_gallery_path_idx\` ON \`reusable_blocks_blocks_gallery\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_gallery_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`caption\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_gallery_items_order_idx\` ON \`_reusable_blocks_v_blocks_gallery_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_gallery_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_gallery_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_gallery_items_file_idx\` ON \`_reusable_blocks_v_blocks_gallery_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`view\` text DEFAULT 'tiles',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_gallery_order_idx\` ON \`_reusable_blocks_v_blocks_gallery\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_gallery_parent_id_idx\` ON \`_reusable_blocks_v_blocks_gallery\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_gallery_path_idx\` ON \`_reusable_blocks_v_blocks_gallery\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_gallery_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer NOT NULL,
  	\`caption\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_gallery\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_gallery_items_order_idx\` ON \`specialists_blocks_gallery_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_gallery_items_parent_id_idx\` ON \`specialists_blocks_gallery_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_gallery_items_file_idx\` ON \`specialists_blocks_gallery_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_gallery\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`view\` text DEFAULT 'tiles',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_gallery_order_idx\` ON \`specialists_blocks_gallery\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_gallery_parent_id_idx\` ON \`specialists_blocks_gallery\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_gallery_path_idx\` ON \`specialists_blocks_gallery\` (\`_path\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_gallery_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_gallery\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_gallery_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_gallery\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_gallery_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_gallery\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_gallery_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_gallery\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_gallery_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_gallery\`;`);
}
