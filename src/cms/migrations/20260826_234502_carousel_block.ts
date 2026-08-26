import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`href\` text,
  	\`link_label\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_carousel_cards_order_idx\` ON \`pages_blocks_carousel_cards\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_carousel_cards_parent_id_idx\` ON \`pages_blocks_carousel_cards\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_carousel_cards_image_idx\` ON \`pages_blocks_carousel_cards\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`mode\` text DEFAULT 'row',
  	\`source_kind\` text DEFAULT 'manual',
  	\`source_limit\` numeric DEFAULT 8,
  	\`source_order\` text DEFAULT 'newest',
  	\`arrows\` integer DEFAULT true,
  	\`dots\` integer DEFAULT false,
  	\`loop\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 0,
  	\`card_width\` text,
  	\`aspect\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_carousel_order_idx\` ON \`pages_blocks_carousel\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_carousel_parent_id_idx\` ON \`pages_blocks_carousel\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_carousel_path_idx\` ON \`pages_blocks_carousel\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`href\` text,
  	\`link_label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_carousel_cards_order_idx\` ON \`_pages_v_blocks_carousel_cards\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_carousel_cards_parent_id_idx\` ON \`_pages_v_blocks_carousel_cards\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_carousel_cards_image_idx\` ON \`_pages_v_blocks_carousel_cards\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`mode\` text DEFAULT 'row',
  	\`source_kind\` text DEFAULT 'manual',
  	\`source_limit\` numeric DEFAULT 8,
  	\`source_order\` text DEFAULT 'newest',
  	\`arrows\` integer DEFAULT true,
  	\`dots\` integer DEFAULT false,
  	\`loop\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 0,
  	\`card_width\` text,
  	\`aspect\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_carousel_order_idx\` ON \`_pages_v_blocks_carousel\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_carousel_parent_id_idx\` ON \`_pages_v_blocks_carousel\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_carousel_path_idx\` ON \`_pages_v_blocks_carousel\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`href\` text,
  	\`link_label\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_carousel_cards_order_idx\` ON \`reusable_blocks_blocks_carousel_cards\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_carousel_cards_parent_id_idx\` ON \`reusable_blocks_blocks_carousel_cards\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_carousel_cards_image_idx\` ON \`reusable_blocks_blocks_carousel_cards\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`mode\` text DEFAULT 'row',
  	\`source_kind\` text DEFAULT 'manual',
  	\`source_limit\` numeric DEFAULT 8,
  	\`source_order\` text DEFAULT 'newest',
  	\`arrows\` integer DEFAULT true,
  	\`dots\` integer DEFAULT false,
  	\`loop\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 0,
  	\`card_width\` text,
  	\`aspect\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_carousel_order_idx\` ON \`reusable_blocks_blocks_carousel\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_carousel_parent_id_idx\` ON \`reusable_blocks_blocks_carousel\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_carousel_path_idx\` ON \`reusable_blocks_blocks_carousel\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`href\` text,
  	\`link_label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_carousel_cards_order_idx\` ON \`_reusable_blocks_v_blocks_carousel_cards\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_carousel_cards_parent_id_idx\` ON \`_reusable_blocks_v_blocks_carousel_cards\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_carousel_cards_image_idx\` ON \`_reusable_blocks_v_blocks_carousel_cards\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`mode\` text DEFAULT 'row',
  	\`source_kind\` text DEFAULT 'manual',
  	\`source_limit\` numeric DEFAULT 8,
  	\`source_order\` text DEFAULT 'newest',
  	\`arrows\` integer DEFAULT true,
  	\`dots\` integer DEFAULT false,
  	\`loop\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 0,
  	\`card_width\` text,
  	\`aspect\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_carousel_order_idx\` ON \`_reusable_blocks_v_blocks_carousel\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_carousel_parent_id_idx\` ON \`_reusable_blocks_v_blocks_carousel\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_carousel_path_idx\` ON \`_reusable_blocks_v_blocks_carousel\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_carousel_cards\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`title\` text,
  	\`text\` text,
  	\`href\` text,
  	\`link_label\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_carousel\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_carousel_cards_order_idx\` ON \`specialists_blocks_carousel_cards\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_carousel_cards_parent_id_idx\` ON \`specialists_blocks_carousel_cards\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_carousel_cards_image_idx\` ON \`specialists_blocks_carousel_cards\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_carousel\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`mode\` text DEFAULT 'row',
  	\`source_kind\` text DEFAULT 'manual',
  	\`source_limit\` numeric DEFAULT 8,
  	\`source_order\` text DEFAULT 'newest',
  	\`arrows\` integer DEFAULT true,
  	\`dots\` integer DEFAULT false,
  	\`loop\` integer DEFAULT false,
  	\`autoplay_seconds\` numeric DEFAULT 0,
  	\`card_width\` text,
  	\`aspect\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_carousel_order_idx\` ON \`specialists_blocks_carousel\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_carousel_parent_id_idx\` ON \`specialists_blocks_carousel\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_carousel_path_idx\` ON \`specialists_blocks_carousel\` (\`_path\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_carousel_cards\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_carousel\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_carousel_cards\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_carousel\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_carousel_cards\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_carousel\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_carousel_cards\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_carousel\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_carousel_cards\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_carousel\`;`);
}
