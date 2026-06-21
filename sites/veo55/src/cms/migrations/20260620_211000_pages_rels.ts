import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Hot-fix: создать `pages_rels` + `_pages_v_rels` + `reusable_blocks_rels` +
 * `_reusable_blocks_v_rels`. Эти таблицы Payload использует для **hasMany
 * relationship**-полей внутри коллекции/блока. До FAQ их не было — все
 * relations были hasMany=false (single FK прямо в блок-таблице).
 *
 * Колонки rels-таблиц — polymorphic FK по одной на каждую целевую коллекцию.
 * Сейчас единственный hasMany — `faq-accordion.groups → faq-groups[]`, поэтому
 * добавляем только `faq_groups_id`. Новые relations будут добавляться через
 * `ALTER TABLE … ADD COLUMN`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_rels\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`faq_groups_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`pages_rels_faq_groups_id_idx\` ON \`pages_rels\` (\`faq_groups_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_pages_v_rels\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`faq_groups_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_faq_groups_id_idx\` ON \`_pages_v_rels\` (\`faq_groups_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`reusable_blocks_rels\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`faq_groups_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_order_idx\` ON \`reusable_blocks_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_parent_idx\` ON \`reusable_blocks_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_path_idx\` ON \`reusable_blocks_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_faq_groups_id_idx\` ON \`reusable_blocks_rels\` (\`faq_groups_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_rels\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`faq_groups_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_order_idx\` ON \`_reusable_blocks_v_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_parent_idx\` ON \`_reusable_blocks_v_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_path_idx\` ON \`_reusable_blocks_v_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_faq_groups_id_idx\` ON \`_reusable_blocks_v_rels\` (\`faq_groups_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`_reusable_blocks_v_rels\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`reusable_blocks_rels\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_rels\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`pages_rels\`;`);
}
