// @safe-bluegreen — expand-only: добавляется таблица подпунктов меню, а
// таблицы hero пересоздаются лишь ради снятия значений по умолчанию. Состав
// колонок не меняется и данные переносятся, поэтому работающий старый цвет
// продолжает читать те же поля.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`site_settings_main_nav_children\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`href\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`external\` integer,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings_main_nav\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`site_settings_main_nav_children_order_idx\` ON \`site_settings_main_nav_children\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`site_settings_main_nav_children_parent_id_idx\` ON \`site_settings_main_nav_children\` (\`_parent_id\`);`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`title_accent\` text,
  	\`subtitle\` text,
  	\`subtitle_short\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero\` RENAME TO \`pages_blocks_hero\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`title_accent\` text,
  	\`subtitle\` text,
  	\`subtitle_short\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero\` RENAME TO \`_pages_v_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`title_accent\` text,
  	\`subtitle\` text,
  	\`subtitle_short\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_reusable_blocks_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new_reusable_blocks_blocks_hero\` RENAME TO \`reusable_blocks_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_hero_order_idx\` ON \`reusable_blocks_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_hero_parent_id_idx\` ON \`reusable_blocks_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_hero_path_idx\` ON \`reusable_blocks_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`title_accent\` text,
  	\`subtitle\` text,
  	\`subtitle_short\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__reusable_blocks_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_hero\` RENAME TO \`_reusable_blocks_v_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_order_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_path_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_specialists_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`title_accent\` text,
  	\`subtitle\` text,
  	\`subtitle_short\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_specialists_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`specialists_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`specialists_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new_specialists_blocks_hero\` RENAME TO \`specialists_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`specialists_blocks_hero_order_idx\` ON \`specialists_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`specialists_blocks_hero_parent_id_idx\` ON \`specialists_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`specialists_blocks_hero_path_idx\` ON \`specialists_blocks_hero\` (\`_path\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`site_settings_main_nav_children\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_pages_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero\` RENAME TO \`pages_blocks_hero\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__pages_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero\` RENAME TO \`_pages_v_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_reusable_blocks_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new_reusable_blocks_blocks_hero\` RENAME TO \`reusable_blocks_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_hero_order_idx\` ON \`reusable_blocks_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_hero_parent_id_idx\` ON \`reusable_blocks_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`reusable_blocks_blocks_hero_path_idx\` ON \`reusable_blocks_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new__reusable_blocks_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_hero\` RENAME TO \`_reusable_blocks_v_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_order_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_path_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_path\`);`)
  await db.run(sql`CREATE TABLE \`__new_specialists_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet' NOT NULL,
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_specialists_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`specialists_blocks_hero\`;`)
  await db.run(sql`DROP TABLE \`specialists_blocks_hero\`;`)
  await db.run(sql`ALTER TABLE \`__new_specialists_blocks_hero\` RENAME TO \`specialists_blocks_hero\`;`)
  await db.run(sql`CREATE INDEX \`specialists_blocks_hero_order_idx\` ON \`specialists_blocks_hero\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`specialists_blocks_hero_parent_id_idx\` ON \`specialists_blocks_hero\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`specialists_blocks_hero_path_idx\` ON \`specialists_blocks_hero\` (\`_path\`);`)
}
