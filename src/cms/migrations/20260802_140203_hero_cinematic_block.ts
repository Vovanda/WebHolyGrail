// @safe-bluegreen — только добавление таблиц нового блока плюс пересоздание
// cta_banner ради снятия DEFAULT: колонки те же, данные переносятся INSERT..SELECT,
// старый цвет на этой схеме работает без изменений.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_cinematic_corners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`position\` text DEFAULT 'top-left',
  	\`title\` text,
  	\`subtitle\` text,
  	\`emphasis\` text DEFAULT 'medium',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero_cinematic\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_corners_order_idx\` ON \`pages_blocks_hero_cinematic_corners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_corners_parent_id_idx\` ON \`pages_blocks_hero_cinematic_corners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_order_idx\` ON \`pages_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_parent_id_idx\` ON \`pages_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_path_idx\` ON \`pages_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_poster_idx\` ON \`pages_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_cinematic_corners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`position\` text DEFAULT 'top-left',
  	\`title\` text,
  	\`subtitle\` text,
  	\`emphasis\` text DEFAULT 'medium',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero_cinematic\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_corners_order_idx\` ON \`_pages_v_blocks_hero_cinematic_corners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_corners_parent_id_idx\` ON \`_pages_v_blocks_hero_cinematic_corners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_order_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_parent_id_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_path_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_poster_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_hero_cinematic_corners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`position\` text DEFAULT 'top-left',
  	\`title\` text,
  	\`subtitle\` text,
  	\`emphasis\` text DEFAULT 'medium',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_hero_cinematic\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_corners_order_idx\` ON \`reusable_blocks_blocks_hero_cinematic_corners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_corners_parent_id_idx\` ON \`reusable_blocks_blocks_hero_cinematic_corners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_order_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_parent_id_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_path_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_poster_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_hero_cinematic_corners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`position\` text DEFAULT 'top-left',
  	\`title\` text,
  	\`subtitle\` text,
  	\`emphasis\` text DEFAULT 'medium',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_hero_cinematic\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_corners_order_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic_corners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_corners_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic_corners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_order_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_path_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_poster_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text,
  	\`cta_secondary_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_cta_banner\` RENAME TO \`pages_blocks_cta_banner\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_order_idx\` ON \`pages_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_parent_id_idx\` ON \`pages_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_path_idx\` ON \`pages_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text,
  	\`cta_secondary_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_cta_banner\` RENAME TO \`_pages_v_blocks_cta_banner\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_order_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_parent_id_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_path_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text,
  	\`cta_secondary_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_cta_banner\` RENAME TO \`reusable_blocks_blocks_cta_banner\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_order_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_parent_id_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_path_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text,
  	\`cta_secondary_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_cta_banner\` RENAME TO \`_reusable_blocks_v_blocks_cta_banner\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_order_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_parent_id_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_path_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_path\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_hero_cinematic_corners\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_hero_cinematic\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_cinematic_corners\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_cinematic\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero_cinematic_corners\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero_cinematic\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero_cinematic_corners\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero_cinematic\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_cta_banner\` RENAME TO \`pages_blocks_cta_banner\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_order_idx\` ON \`pages_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_parent_id_idx\` ON \`pages_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_path_idx\` ON \`pages_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_cta_banner\` RENAME TO \`_pages_v_blocks_cta_banner\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_order_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_parent_id_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_path_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_cta_banner\` RENAME TO \`reusable_blocks_blocks_cta_banner\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_order_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_parent_id_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_path_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_cta_banner\`("_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "subtitle", "cta_primary_label", "cta_primary_href", "cta_secondary_label", "cta_secondary_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_cta_banner\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_cta_banner\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_cta_banner\` RENAME TO \`_reusable_blocks_v_blocks_cta_banner\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_order_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_parent_id_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_path_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_path\`);`,
  );
}
