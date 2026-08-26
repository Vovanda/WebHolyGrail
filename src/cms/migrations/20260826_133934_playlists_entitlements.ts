// @safe-bluegreen — expand-only: наборы роликов и права на них.
// Старый цвет о них не знает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`playlists_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_id\` integer NOT NULL,
  	FOREIGN KEY (\`video_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`playlists_items_order_idx\` ON \`playlists_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`playlists_items_parent_id_idx\` ON \`playlists_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`playlists_items_video_idx\` ON \`playlists_items\` (\`video_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`playlists\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`short_code\` text,
  	\`description\` text,
  	\`cover_id\` integer,
  	\`author_id\` integer NOT NULL,
  	\`access\` text DEFAULT 'public',
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`playlists_short_code_idx\` ON \`playlists\` (\`short_code\`);`,
  );
  await db.run(sql`CREATE INDEX \`playlists_cover_idx\` ON \`playlists\` (\`cover_id\`);`);
  await db.run(sql`CREATE INDEX \`playlists_author_idx\` ON \`playlists\` (\`author_id\`);`);
  await db.run(sql`CREATE INDEX \`playlists_updated_at_idx\` ON \`playlists\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`playlists_created_at_idx\` ON \`playlists\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`entitlements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`viewer_id\` integer NOT NULL,
  	\`playlist_id\` integer NOT NULL,
  	\`source\` text DEFAULT 'manual',
  	\`expires_at\` text,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`viewer_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`entitlements_viewer_idx\` ON \`entitlements\` (\`viewer_id\`);`);
  await db.run(
    sql`CREATE INDEX \`entitlements_playlist_idx\` ON \`entitlements\` (\`playlist_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_updated_at_idx\` ON \`entitlements\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_created_at_idx\` ON \`entitlements\` (\`created_at\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`playlists_id\` integer REFERENCES playlists(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`entitlements_id\` integer REFERENCES entitlements(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_playlists_id_idx\` ON \`payload_locked_documents_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_entitlements_id_idx\` ON \`payload_locked_documents_rels\` (\`entitlements_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`playlists_items\`;`);
  await db.run(sql`DROP TABLE \`playlists\`;`);
  await db.run(sql`DROP TABLE \`entitlements\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`pages_id\` integer,
  	\`form_submissions_id\` integer,
  	\`reusable_blocks_id\` integer,
  	\`social_posts_id\` integer,
  	\`comments_id\` integer,
  	\`faq_groups_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`tags_id\` integer,
  	\`authors_id\` integer,
  	\`cities_id\` integer,
  	\`specialists_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`social_posts_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`comments_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`cities_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`specialists_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id", "articles_id", "threads_id", "tags_id", "authors_id", "cities_id", "specialists_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id", "articles_id", "threads_id", "tags_id", "authors_id", "cities_id", "specialists_id" FROM \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
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
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_reusable_blocks_id_idx\` ON \`payload_locked_documents_rels\` (\`reusable_blocks_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_social_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`social_posts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_comments_id_idx\` ON \`payload_locked_documents_rels\` (\`comments_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_articles_id_idx\` ON \`payload_locked_documents_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_threads_id_idx\` ON \`payload_locked_documents_rels\` (\`threads_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_tags_id_idx\` ON \`payload_locked_documents_rels\` (\`tags_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_authors_id_idx\` ON \`payload_locked_documents_rels\` (\`authors_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_specialists_id_idx\` ON \`payload_locked_documents_rels\` (\`specialists_id\`);`,
  );
}
