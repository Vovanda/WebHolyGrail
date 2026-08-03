// @needs-maintenance — таблица media пересоздаётся (alt перестал быть обязательным).
// Старый код совместим: он всегда передавал alt, поэтому blue-green переживает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_specialist_profile_show\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_specialist_profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_profile_show_order_idx\` ON \`pages_blocks_specialist_profile_show\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_profile_show_parent_idx\` ON \`pages_blocks_specialist_profile_show\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_specialist_profile\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_profile_order_idx\` ON \`pages_blocks_specialist_profile\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_profile_parent_id_idx\` ON \`pages_blocks_specialist_profile\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_profile_path_idx\` ON \`pages_blocks_specialist_profile\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_document_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`title\` text,
  	\`note\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_document_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_document_list_items_order_idx\` ON \`pages_blocks_document_list_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_document_list_items_parent_id_idx\` ON \`pages_blocks_document_list_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_document_list_items_file_idx\` ON \`pages_blocks_document_list_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_document_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Документы',
  	\`description\` text,
  	\`layout\` text DEFAULT 'cards',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_document_list_order_idx\` ON \`pages_blocks_document_list\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_document_list_parent_id_idx\` ON \`pages_blocks_document_list\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_document_list_path_idx\` ON \`pages_blocks_document_list\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_specialist_profile_show\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_specialist_profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_profile_show_order_idx\` ON \`_pages_v_blocks_specialist_profile_show\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_profile_show_parent_idx\` ON \`_pages_v_blocks_specialist_profile_show\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_specialist_profile\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_profile_order_idx\` ON \`_pages_v_blocks_specialist_profile\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_profile_parent_id_idx\` ON \`_pages_v_blocks_specialist_profile\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_profile_path_idx\` ON \`_pages_v_blocks_specialist_profile\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_document_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`title\` text,
  	\`note\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_document_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_document_list_items_order_idx\` ON \`_pages_v_blocks_document_list_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_document_list_items_parent_id_idx\` ON \`_pages_v_blocks_document_list_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_document_list_items_file_idx\` ON \`_pages_v_blocks_document_list_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_document_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Документы',
  	\`description\` text,
  	\`layout\` text DEFAULT 'cards',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_document_list_order_idx\` ON \`_pages_v_blocks_document_list\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_document_list_parent_id_idx\` ON \`_pages_v_blocks_document_list\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_document_list_path_idx\` ON \`_pages_v_blocks_document_list\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_specialist_profile_show\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`reusable_blocks_blocks_specialist_profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_profile_show_order_idx\` ON \`reusable_blocks_blocks_specialist_profile_show\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_profile_show_parent_idx\` ON \`reusable_blocks_blocks_specialist_profile_show\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_specialist_profile\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_profile_order_idx\` ON \`reusable_blocks_blocks_specialist_profile\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_profile_parent_id_idx\` ON \`reusable_blocks_blocks_specialist_profile\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_profile_path_idx\` ON \`reusable_blocks_blocks_specialist_profile\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_document_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`title\` text,
  	\`note\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_document_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_document_list_items_order_idx\` ON \`reusable_blocks_blocks_document_list_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_document_list_items_parent_id_idx\` ON \`reusable_blocks_blocks_document_list_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_document_list_items_file_idx\` ON \`reusable_blocks_blocks_document_list_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_document_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Документы',
  	\`description\` text,
  	\`layout\` text DEFAULT 'cards',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_document_list_order_idx\` ON \`reusable_blocks_blocks_document_list\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_document_list_parent_id_idx\` ON \`reusable_blocks_blocks_document_list\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_document_list_path_idx\` ON \`reusable_blocks_blocks_document_list\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_specialist_profile_show\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_specialist_profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_profile_show_order_idx\` ON \`_reusable_blocks_v_blocks_specialist_profile_show\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_profile_show_parent_idx\` ON \`_reusable_blocks_v_blocks_specialist_profile_show\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_specialist_profile\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_profile_order_idx\` ON \`_reusable_blocks_v_blocks_specialist_profile\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_profile_parent_id_idx\` ON \`_reusable_blocks_v_blocks_specialist_profile\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_profile_path_idx\` ON \`_reusable_blocks_v_blocks_specialist_profile\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_document_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`file_id\` integer,
  	\`title\` text,
  	\`note\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_document_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_document_list_items_order_idx\` ON \`_reusable_blocks_v_blocks_document_list_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_document_list_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_document_list_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_document_list_items_file_idx\` ON \`_reusable_blocks_v_blocks_document_list_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_document_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Документы',
  	\`description\` text,
  	\`layout\` text DEFAULT 'cards',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_document_list_order_idx\` ON \`_reusable_blocks_v_blocks_document_list\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_document_list_parent_id_idx\` ON \`_reusable_blocks_v_blocks_document_list\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_document_list_path_idx\` ON \`_reusable_blocks_v_blocks_document_list\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_specialist_profile_show\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`specialists_blocks_specialist_profile\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_profile_show_order_idx\` ON \`specialists_blocks_specialist_profile_show\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_profile_show_parent_idx\` ON \`specialists_blocks_specialist_profile_show\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_specialist_profile\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_profile_order_idx\` ON \`specialists_blocks_specialist_profile\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_profile_parent_id_idx\` ON \`specialists_blocks_specialist_profile\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_profile_path_idx\` ON \`specialists_blocks_specialist_profile\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_document_list_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`file_id\` integer NOT NULL,
  	\`title\` text,
  	\`note\` text,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_document_list\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_document_list_items_order_idx\` ON \`specialists_blocks_document_list_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_document_list_items_parent_id_idx\` ON \`specialists_blocks_document_list_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_document_list_items_file_idx\` ON \`specialists_blocks_document_list_items\` (\`file_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_document_list\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Документы',
  	\`description\` text,
  	\`layout\` text DEFAULT 'cards',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_document_list_order_idx\` ON \`specialists_blocks_document_list\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_document_list_parent_id_idx\` ON \`specialists_blocks_document_list\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_document_list_path_idx\` ON \`specialists_blocks_document_list\` (\`_path\`);`,
  );
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text,
  	\`preview_id\` integer,
  	\`prefix\` text DEFAULT 'media',
  	\`caption\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text,
  	\`sizes_hero_url\` text,
  	\`sizes_hero_width\` numeric,
  	\`sizes_hero_height\` numeric,
  	\`sizes_hero_mime_type\` text,
  	\`sizes_hero_filesize\` numeric,
  	\`sizes_hero_filename\` text,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_media\`("id", "alt", "prefix", "caption", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename") SELECT "id", "alt", "prefix", "caption", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename" FROM \`media\`;`,
  );
  await db.run(sql`DROP TABLE \`media\`;`);
  await db.run(sql`ALTER TABLE \`__new_media\` RENAME TO \`media\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`media_preview_idx\` ON \`media\` (\`preview_id\`);`);
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`);
  await db.run(
    sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_hero_sizes_hero_filename_idx\` ON \`media\` (\`sizes_hero_filename\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`policy_href\` text DEFAULT '/privacy';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`consent_label\` text DEFAULT 'Согласен на обработку персональных данных';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`policy_href\` text DEFAULT '/privacy';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`consent_label\` text DEFAULT 'Согласен на обработку персональных данных';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`policy_href\` text DEFAULT '/privacy';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`consent_label\` text DEFAULT 'Согласен на обработку персональных данных';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`policy_href\` text DEFAULT '/privacy';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`consent_label\` text DEFAULT 'Согласен на обработку персональных данных';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`policy_href\` text DEFAULT '/privacy';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`consent_label\` text DEFAULT 'Согласен на обработку персональных данных';`,
  );
  await db.run(sql`ALTER TABLE \`specialists\` ADD \`seo_title\` text;`);
  await db.run(sql`ALTER TABLE \`specialists\` ADD \`seo_description\` text;`);
  await db.run(
    sql`ALTER TABLE \`specialists\` ADD \`seo_og_image_id\` integer REFERENCES media(id);`,
  );
  await db.run(sql`ALTER TABLE \`specialists\` ADD \`seo_noindex\` integer;`);
  await db.run(
    sql`CREATE INDEX \`specialists_seo_seo_og_image_idx\` ON \`specialists\` (\`seo_og_image_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`personal_data_operator_name\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`personal_data_operator_inn\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`personal_data_operator_address\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`personal_data_contact_email\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`personal_data_rkn_registry_number\` text;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`personal_data_rkn_notified\` integer DEFAULT false;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`personal_data_policy_updated_at\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_specialist_profile_show\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_specialist_profile\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_document_list_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_document_list\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_specialist_profile_show\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_specialist_profile\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_document_list_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_document_list\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_specialist_profile_show\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_specialist_profile\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_document_list_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_document_list\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_specialist_profile_show\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_specialist_profile\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_document_list_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_document_list\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_specialist_profile_show\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_specialist_profile\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_document_list_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_document_list\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`prefix\` text DEFAULT 'media',
  	\`caption\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text,
  	\`sizes_hero_url\` text,
  	\`sizes_hero_width\` numeric,
  	\`sizes_hero_height\` numeric,
  	\`sizes_hero_mime_type\` text,
  	\`sizes_hero_filesize\` numeric,
  	\`sizes_hero_filename\` text
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_media\`("id", "alt", "prefix", "caption", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename") SELECT "id", "alt", "prefix", "caption", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename" FROM \`media\`;`,
  );
  await db.run(sql`DROP TABLE \`media\`;`);
  await db.run(sql`ALTER TABLE \`__new_media\` RENAME TO \`media\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`);
  await db.run(
    sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_hero_sizes_hero_filename_idx\` ON \`media\` (\`sizes_hero_filename\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_specialists\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`full_name\` text NOT NULL,
  	\`nickname\` text,
  	\`photo_id\` integer,
  	\`headline\` text,
  	\`city_id\` integer,
  	\`bio\` text,
  	\`accepting_clients\` integer DEFAULT true,
  	\`contacts_phone\` text,
  	\`contacts_email\` text,
  	\`contacts_telegram\` text,
  	\`contacts_whatsapp\` text,
  	\`contacts_vk\` text,
  	\`contacts_youtube\` text,
  	\`slug\` text,
  	\`owner_id\` integer,
  	\`rating\` numeric,
  	\`rating_public\` integer DEFAULT false,
  	\`boost\` numeric DEFAULT 0,
  	\`requests_count\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`city_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_specialists\`("id", "full_name", "nickname", "photo_id", "headline", "city_id", "bio", "accepting_clients", "contacts_phone", "contacts_email", "contacts_telegram", "contacts_whatsapp", "contacts_vk", "contacts_youtube", "slug", "owner_id", "rating", "rating_public", "boost", "requests_count", "updated_at", "created_at") SELECT "id", "full_name", "nickname", "photo_id", "headline", "city_id", "bio", "accepting_clients", "contacts_phone", "contacts_email", "contacts_telegram", "contacts_whatsapp", "contacts_vk", "contacts_youtube", "slug", "owner_id", "rating", "rating_public", "boost", "requests_count", "updated_at", "created_at" FROM \`specialists\`;`,
  );
  await db.run(sql`DROP TABLE \`specialists\`;`);
  await db.run(sql`ALTER TABLE \`__new_specialists\` RENAME TO \`specialists\`;`);
  await db.run(sql`CREATE INDEX \`specialists_photo_idx\` ON \`specialists\` (\`photo_id\`);`);
  await db.run(sql`CREATE INDEX \`specialists_city_idx\` ON \`specialists\` (\`city_id\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`specialists_slug_idx\` ON \`specialists\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`specialists_owner_idx\` ON \`specialists\` (\`owner_id\`);`);
  await db.run(
    sql`CREATE INDEX \`specialists_updated_at_idx\` ON \`specialists\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_created_at_idx\` ON \`specialists\` (\`created_at\`);`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`policy_href\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`consent_label\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`policy_href\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`consent_label\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`policy_href\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`consent_label\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`policy_href\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`consent_label\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`policy_href\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`consent_label\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_operator_name\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_operator_inn\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_operator_address\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_contact_email\`;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_rkn_registry_number\`;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_rkn_notified\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`personal_data_policy_updated_at\`;`);
}
