// @safe-bluegreen — новая коллекция кодов и новые поля настроек; старый код их не читает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`access_codes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text,
  	\`playlist_id\` integer NOT NULL,
  	\`requires_sign_in\` integer DEFAULT true,
  	\`max_uses\` numeric,
  	\`used_count\` numeric DEFAULT 0,
  	\`expires_at\` text,
  	\`grant_days\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`access_codes_code_idx\` ON \`access_codes\` (\`code\`);`);
  await db.run(
    sql`CREATE INDEX \`access_codes_playlist_idx\` ON \`access_codes\` (\`playlist_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_updated_at_idx\` ON \`access_codes\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_created_at_idx\` ON \`access_codes\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_entitlements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`viewer_id\` integer,
  	\`phone\` text,
  	\`email\` text,
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
  await db.run(
    sql`INSERT INTO \`__new_entitlements\`("id", "viewer_id", "playlist_id", "source", "expires_at", "note", "updated_at", "created_at") SELECT "id", "viewer_id", "playlist_id", "source", "expires_at", "note", "updated_at", "created_at" FROM \`entitlements\`;`,
  );
  await db.run(sql`DROP TABLE \`entitlements\`;`);
  await db.run(sql`ALTER TABLE \`__new_entitlements\` RENAME TO \`entitlements\`;`);
  await db.run(sql`CREATE INDEX \`entitlements_viewer_idx\` ON \`entitlements\` (\`viewer_id\`);`);
  await db.run(sql`CREATE INDEX \`entitlements_phone_idx\` ON \`entitlements\` (\`phone\`);`);
  await db.run(sql`CREATE INDEX \`entitlements_email_idx\` ON \`entitlements\` (\`email\`);`);
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
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`access_codes_id\` integer REFERENCES access_codes(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_access_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`access_codes_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_code_length\` text DEFAULT '6';`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`video_code_ttl_minutes\` numeric DEFAULT 5;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_access_days\` numeric DEFAULT 30;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`access_codes\`;`);
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
  	\`playlists_id\` integer,
  	\`entitlements_id\` integer,
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
  	FOREIGN KEY (\`specialists_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`entitlements_id\`) REFERENCES \`entitlements\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id", "articles_id", "threads_id", "tags_id", "authors_id", "cities_id", "specialists_id", "playlists_id", "entitlements_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id", "articles_id", "threads_id", "tags_id", "authors_id", "cities_id", "specialists_id", "playlists_id", "entitlements_id" FROM \`payload_locked_documents_rels\`;`,
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
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_playlists_id_idx\` ON \`payload_locked_documents_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_entitlements_id_idx\` ON \`payload_locked_documents_rels\` (\`entitlements_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_entitlements\` (
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
  await db.run(
    sql`INSERT INTO \`__new_entitlements\`("id", "viewer_id", "playlist_id", "source", "expires_at", "note", "updated_at", "created_at") SELECT "id", "viewer_id", "playlist_id", "source", "expires_at", "note", "updated_at", "created_at" FROM \`entitlements\`;`,
  );
  await db.run(sql`DROP TABLE \`entitlements\`;`);
  await db.run(sql`ALTER TABLE \`__new_entitlements\` RENAME TO \`entitlements\`;`);
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
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_code_length\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_code_ttl_minutes\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_access_days\`;`);
}
