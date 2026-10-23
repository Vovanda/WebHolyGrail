// @safe-bluegreen - миграция expand-only: новые таблицы разделов каталога и колонки позиций, прежняя версия их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`offers_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`offers_rels_order_idx\` ON \`offers_rels\` (\`order\`);`);
  await db.run(sql`CREATE INDEX \`offers_rels_parent_idx\` ON \`offers_rels\` (\`parent_id\`);`);
  await db.run(sql`CREATE INDEX \`offers_rels_path_idx\` ON \`offers_rels\` (\`path\`);`);
  await db.run(sql`CREATE INDEX \`offers_rels_media_id_idx\` ON \`offers_rels\` (\`media_id\`);`);
  await db.run(sql`CREATE TABLE \`catalog_sections_characteristics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`key\` text NOT NULL,
  	\`unit\` text,
  	\`kind\` text DEFAULT 'enum' NOT NULL,
  	\`filter\` text DEFAULT 'checks' NOT NULL,
  	\`group\` text,
  	\`in_card\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`catalog_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`catalog_sections_characteristics_order_idx\` ON \`catalog_sections_characteristics\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_characteristics_parent_id_idx\` ON \`catalog_sections_characteristics\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`catalog_sections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`catalog_sections_slug_idx\` ON \`catalog_sections\` (\`slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_updated_at_idx\` ON \`catalog_sections\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_created_at_idx\` ON \`catalog_sections\` (\`created_at\`);`,
  );
  await db.run(sql`ALTER TABLE \`offers\` ADD \`slug\` text;`);
  await db.run(
    sql`ALTER TABLE \`offers\` ADD \`section_id\` integer REFERENCES catalog_sections(id);`,
  );
  await db.run(sql`ALTER TABLE \`offers\` ADD \`description\` text;`);
  await db.run(sql`ALTER TABLE \`offers\` ADD \`specs\` text;`);
  await db.run(sql`CREATE UNIQUE INDEX \`offers_slug_idx\` ON \`offers\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`offers_section_idx\` ON \`offers\` (\`section_id\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`catalog_sections_id\` integer REFERENCES catalog_sections(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_catalog_sections_id_idx\` ON \`payload_locked_documents_rels\` (\`catalog_sections_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`offers_rels\`;`);
  await db.run(sql`DROP TABLE \`catalog_sections_characteristics\`;`);
  await db.run(sql`DROP TABLE \`catalog_sections\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_offers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`image_id\` integer,
  	\`summary\` text,
  	\`price_micros\` numeric,
  	\`stock\` numeric,
  	\`how_to_buy\` text DEFAULT 'cart' NOT NULL,
  	\`deposit_micros\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_offers\`("id", "title", "image_id", "summary", "price_micros", "stock", "how_to_buy", "deposit_micros", "updated_at", "created_at") SELECT "id", "title", "image_id", "summary", "price_micros", "stock", "how_to_buy", "deposit_micros", "updated_at", "created_at" FROM \`offers\`;`,
  );
  await db.run(sql`DROP TABLE \`offers\`;`);
  await db.run(sql`ALTER TABLE \`__new_offers\` RENAME TO \`offers\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`offers_image_idx\` ON \`offers\` (\`image_id\`);`);
  await db.run(sql`CREATE INDEX \`offers_updated_at_idx\` ON \`offers\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`offers_created_at_idx\` ON \`offers\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`reusable_blocks_id\` integer,
  	\`faq_groups_id\` integer,
  	\`media_id\` integer,
  	\`playlists_id\` integer,
  	\`form_submissions_id\` integer,
  	\`offers_id\` integer,
  	\`orders_id\` integer,
  	\`invoices_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`authors_id\` integer,
  	\`tags_id\` integer,
  	\`media_accesses_id\` integer,
  	\`media_access_rights_id\` integer,
  	\`media_access_codes_id\` integer,
  	\`media_access_links_id\` integer,
  	\`specialists_id\` integer,
  	\`cities_id\` integer,
  	\`social_posts_id\` integer,
  	\`comments_id\` integer,
  	\`users_id\` integer,
  	\`feature_toggles_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`offers_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`orders_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`invoices_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_accesses_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_access_rights_id\`) REFERENCES \`media_access_rights\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_access_codes_id\`) REFERENCES \`media_access_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_access_links_id\`) REFERENCES \`media_access_links\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`specialists_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`cities_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`social_posts_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`comments_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`feature_toggles_id\`) REFERENCES \`feature_toggles\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "reusable_blocks_id", "faq_groups_id", "media_id", "playlists_id", "form_submissions_id", "offers_id", "orders_id", "invoices_id", "articles_id", "threads_id", "authors_id", "tags_id", "media_accesses_id", "media_access_rights_id", "media_access_codes_id", "media_access_links_id", "specialists_id", "cities_id", "social_posts_id", "comments_id", "users_id", "feature_toggles_id") SELECT "id", "order", "parent_id", "path", "pages_id", "reusable_blocks_id", "faq_groups_id", "media_id", "playlists_id", "form_submissions_id", "offers_id", "orders_id", "invoices_id", "articles_id", "threads_id", "authors_id", "tags_id", "media_accesses_id", "media_access_rights_id", "media_access_codes_id", "media_access_links_id", "specialists_id", "cities_id", "social_posts_id", "comments_id", "users_id", "feature_toggles_id" FROM \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_reusable_blocks_id_idx\` ON \`payload_locked_documents_rels\` (\`reusable_blocks_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_playlists_id_idx\` ON \`payload_locked_documents_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_invoices_id_idx\` ON \`payload_locked_documents_rels\` (\`invoices_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_threads_id_idx\` ON \`payload_locked_documents_rels\` (\`threads_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_authors_id_idx\` ON \`payload_locked_documents_rels\` (\`authors_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_accesses_id_idx\` ON \`payload_locked_documents_rels\` (\`media_accesses_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_rights_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_rights_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_codes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_links_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_links_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_specialists_id_idx\` ON \`payload_locked_documents_rels\` (\`specialists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_social_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`social_posts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_comments_id_idx\` ON \`payload_locked_documents_rels\` (\`comments_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_feature_toggles_id_idx\` ON \`payload_locked_documents_rels\` (\`feature_toggles_id\`);`,
  );
}
