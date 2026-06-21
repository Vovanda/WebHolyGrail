import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * FAQ-группы + блок faq-accordion.
 *
 * Создаёт:
 *  - Collection `faq_groups` (+ array `faq_groups_items`, + versions
 *    `_faq_groups_v`, `_faq_groups_v_version_items`).
 *  - Block `pages_blocks_faq_accordion` (+ `_rels` для hasMany groups,
 *    + version-параллели).
 *  - То же в `reusable_blocks_blocks_faq_accordion` (блок включён в
 *    REUSABLE_INNER_BLOCKS).
 *  - Поле `faq_groups_id` в `payload_locked_documents_rels` (FK для
 *    polymorphic admin-locks).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ========== faq_groups + versions ==========
  await db.run(sql`CREATE TABLE \`faq_groups\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`order\` integer NOT NULL,
    \`emoji\` text,
    \`title\` text NOT NULL,
    \`slug\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`_status\` text DEFAULT 'draft'
  );`);
  await db.run(sql`CREATE INDEX \`faq_groups_order_idx\` ON \`faq_groups\` (\`order\`);`);
  await db.run(sql`CREATE INDEX \`faq_groups_status_idx\` ON \`faq_groups\` (\`_status\`);`);

  await db.run(sql`CREATE TABLE \`faq_groups_items\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`question\` text NOT NULL,
    \`answer\` text,
    \`open_by_default\` integer DEFAULT false,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`faq_groups_items_order_idx\` ON \`faq_groups_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`faq_groups_items_parent_id_idx\` ON \`faq_groups_items\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_faq_groups_v\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`parent_id\` integer,
    \`version_order\` integer,
    \`version_emoji\` text,
    \`version_title\` text,
    \`version_slug\` text,
    \`version_updated_at\` text,
    \`version_created_at\` text,
    \`version__status\` text DEFAULT 'draft',
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`latest\` integer,
    \`autosave\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`);
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_parent_idx\` ON \`_faq_groups_v\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_order_idx\` ON \`_faq_groups_v\` (\`version_order\`);`,
  );

  await db.run(sql`CREATE TABLE \`_faq_groups_v_version_items\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`question\` text,
    \`answer\` text,
    \`open_by_default\` integer DEFAULT false,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_faq_groups_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_items_order_idx\` ON \`_faq_groups_v_version_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_items_parent_id_idx\` ON \`_faq_groups_v_version_items\` (\`_parent_id\`);`,
  );

  // ========== pages_blocks_faq_accordion + rels + versions ==========
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_accordion\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`title\` text,
    \`title_emoji\` text,
    \`lead\` text,
    \`show_chips\` integer DEFAULT true,
    \`cta_text\` text,
    \`cta_link_label\` text,
    \`cta_link_href\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_faq_accordion_order_idx\` ON \`pages_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_faq_accordion_parent_id_idx\` ON \`pages_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_faq_accordion_path_idx\` ON \`pages_blocks_faq_accordion\` (\`_path\`);`,
  );

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_accordion\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`title\` text,
    \`title_emoji\` text,
    \`lead\` text,
    \`show_chips\` integer DEFAULT true,
    \`cta_text\` text,
    \`cta_link_label\` text,
    \`cta_link_href\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`_uuid\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_faq_accordion_order_idx\` ON \`_pages_v_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_faq_accordion_parent_id_idx\` ON \`_pages_v_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_faq_accordion_path_idx\` ON \`_pages_v_blocks_faq_accordion\` (\`_path\`);`,
  );

  // ========== reusable_blocks_blocks_faq_accordion + versions ==========
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_faq_accordion\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`title\` text,
    \`title_emoji\` text,
    \`lead\` text,
    \`show_chips\` integer DEFAULT true,
    \`cta_text\` text,
    \`cta_link_label\` text,
    \`cta_link_href\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_faq_accordion_order_idx\` ON \`reusable_blocks_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_faq_accordion_parent_id_idx\` ON \`reusable_blocks_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_faq_accordion_path_idx\` ON \`reusable_blocks_blocks_faq_accordion\` (\`_path\`);`,
  );

  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_faq_accordion\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`title\` text,
    \`title_emoji\` text,
    \`lead\` text,
    \`show_chips\` integer DEFAULT true,
    \`cta_text\` text,
    \`cta_link_label\` text,
    \`cta_link_href\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`_uuid\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_faq_accordion_order_idx\` ON \`_reusable_blocks_v_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_faq_accordion_parent_id_idx\` ON \`_reusable_blocks_v_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_faq_accordion_path_idx\` ON \`_reusable_blocks_v_blocks_faq_accordion\` (\`_path\`);`,
  );

  // ========== payload_locked_documents_rels — FK для faq_groups ==========
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD COLUMN \`faq_groups_id\` integer REFERENCES faq_groups(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_groups_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_faq_groups_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`faq_groups_id\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`_reusable_blocks_v_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`reusable_blocks_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`_pages_v_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`pages_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`_faq_groups_v_version_items\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`_faq_groups_v\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`faq_groups_items\`;`);
  await db.run(sql`DROP TABLE IF EXISTS \`faq_groups\`;`);
}
