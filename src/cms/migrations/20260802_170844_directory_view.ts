// @safe-bluegreen — колонки режима витрины, данные переносятся
// Правлено руками: генератор включал новые колонки в SELECT из старой
// таблицы, где их ещё нет — миграция падала на «no such column: view».
// В перенос они не входят, значения берутся из DEFAULT.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`view\` text DEFAULT 'people',
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT false,
  	\`more_label\` text DEFAULT 'Все специалисты',
  	\`more_href\` text DEFAULT '/specialists',
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_specialist_directory\` RENAME TO \`pages_blocks_specialist_directory\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_order_idx\` ON \`pages_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_parent_id_idx\` ON \`pages_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_path_idx\` ON \`pages_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`view\` text DEFAULT 'people',
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT false,
  	\`more_label\` text DEFAULT 'Все специалисты',
  	\`more_href\` text DEFAULT '/specialists',
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_specialist_directory\` RENAME TO \`_pages_v_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_order_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_parent_id_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_path_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`view\` text DEFAULT 'people',
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT false,
  	\`more_label\` text DEFAULT 'Все специалисты',
  	\`more_href\` text DEFAULT '/specialists',
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_specialist_directory\` RENAME TO \`reusable_blocks_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_order_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_parent_id_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_path_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`view\` text DEFAULT 'people',
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT false,
  	\`more_label\` text DEFAULT 'Все специалисты',
  	\`more_href\` text DEFAULT '/specialists',
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_specialist_directory\` RENAME TO \`_reusable_blocks_v_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_order_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_parent_id_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_path_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_specialists_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`view\` text DEFAULT 'people' NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT false,
  	\`more_label\` text DEFAULT 'Все специалисты',
  	\`more_href\` text DEFAULT '/specialists',
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_specialists_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`specialists_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`specialists_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_specialists_blocks_specialist_directory\` RENAME TO \`specialists_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_order_idx\` ON \`specialists_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_parent_id_idx\` ON \`specialists_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_path_idx\` ON \`specialists_blocks_specialist_directory\` (\`_path\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_specialist_directory\` RENAME TO \`pages_blocks_specialist_directory\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_order_idx\` ON \`pages_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_parent_id_idx\` ON \`pages_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_path_idx\` ON \`pages_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_specialist_directory\` RENAME TO \`_pages_v_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_order_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_parent_id_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_path_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_specialist_directory\` RENAME TO \`reusable_blocks_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_order_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_parent_id_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_path_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_specialist_directory\` RENAME TO \`_reusable_blocks_v_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_order_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_parent_id_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_path_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_specialists_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_specialists_blocks_specialist_directory\`("_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "description", "only_accepting", "order", "limit", "show_cities", "empty_text", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`specialists_blocks_specialist_directory\`;`,
  );
  await db.run(sql`DROP TABLE \`specialists_blocks_specialist_directory\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_specialists_blocks_specialist_directory\` RENAME TO \`specialists_blocks_specialist_directory\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_order_idx\` ON \`specialists_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_parent_id_idx\` ON \`specialists_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_path_idx\` ON \`specialists_blocks_specialist_directory\` (\`_path\`);`,
  );
}
