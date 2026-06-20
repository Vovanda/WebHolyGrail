import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Generic блок `certified-notice` (сертификат с чек-листом) — добавлен в
 * `REUSABLE_INNER_BLOCKS`, значит таблицы нужны в обеих коллекциях
 * (`pages` и `reusable_blocks`) + их `_v_` версионных копиях.
 *
 * Поля: `kicker`, `title`, `body`, `criteria_title`, `criteria[].text`.
 * Visibility-колонки добавляются сразу (миграция `block_visibility` уже
 * прошла, новые таблицы должны прийти с ними out-of-the-box).
 *
 * Создан вручную, drizzle-snapshot не обновлён. Следующая `migrate:create`
 * заметит новые таблицы как «create» — отвечать так.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ============================================================
  // pages_blocks_certified_notice + criteria
  // ============================================================
  await db.run(sql`CREATE TABLE \`pages_blocks_certified_notice_criteria\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`text\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_criteria_order_idx\` ON \`pages_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_criteria_parent_id_idx\` ON \`pages_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`pages_blocks_certified_notice\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`kicker\` text,
    \`title\` text,
    \`body\` text,
    \`criteria_title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_order_idx\` ON \`pages_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_parent_id_idx\` ON \`pages_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_path_idx\` ON \`pages_blocks_certified_notice\` (\`_path\`);`,
  );

  // ============================================================
  // _pages_v_blocks_certified_notice + criteria
  // ============================================================
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_certified_notice_criteria\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`text\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_criteria_order_idx\` ON \`_pages_v_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_criteria_parent_id_idx\` ON \`_pages_v_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_certified_notice\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`kicker\` text,
    \`title\` text,
    \`body\` text,
    \`criteria_title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`_uuid\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_order_idx\` ON \`_pages_v_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_parent_id_idx\` ON \`_pages_v_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_path_idx\` ON \`_pages_v_blocks_certified_notice\` (\`_path\`);`,
  );

  // ============================================================
  // reusable_blocks_blocks_certified_notice + criteria
  // ============================================================
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_certified_notice_criteria\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`text\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_criteria_order_idx\` ON \`reusable_blocks_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_criteria_parent_id_idx\` ON \`reusable_blocks_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_certified_notice\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`kicker\` text,
    \`title\` text,
    \`body\` text,
    \`criteria_title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_order_idx\` ON \`reusable_blocks_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_parent_id_idx\` ON \`reusable_blocks_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_path_idx\` ON \`reusable_blocks_blocks_certified_notice\` (\`_path\`);`,
  );

  // ============================================================
  // _reusable_blocks_v_blocks_certified_notice + criteria
  // ============================================================
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_certified_notice_criteria\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`text\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_criteria_order_idx\` ON \`_reusable_blocks_v_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_criteria_parent_id_idx\` ON \`_reusable_blocks_v_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_certified_notice\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`kicker\` text,
    \`title\` text,
    \`body\` text,
    \`criteria_title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`_uuid\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_order_idx\` ON \`_reusable_blocks_v_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_parent_id_idx\` ON \`_reusable_blocks_v_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_path_idx\` ON \`_reusable_blocks_v_blocks_certified_notice\` (\`_path\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_certified_notice\`;`);
}
