import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`feature_toggles\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`key\` text NOT NULL,
  	\`group\` text,
  	\`description\` text,
  	\`production\` integer DEFAULT false,
  	\`staging\` integer DEFAULT false,
  	\`development\` integer DEFAULT true,
  	\`enable_at\` text,
  	\`source\` text DEFAULT 'local',
  	\`changed_by_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`changed_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`feature_toggles_key_idx\` ON \`feature_toggles\` (\`key\`);`,
  );
  await db.run(sql`CREATE INDEX \`feature_toggles_group_idx\` ON \`feature_toggles\` (\`group\`);`);
  await db.run(
    sql`CREATE INDEX \`feature_toggles_changed_by_idx\` ON \`feature_toggles\` (\`changed_by_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`feature_toggles_updated_at_idx\` ON \`feature_toggles\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`feature_toggles_created_at_idx\` ON \`feature_toggles\` (\`created_at\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`feature_toggles_id\` integer REFERENCES feature_toggles(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_feature_toggles_id_idx\` ON \`payload_locked_documents_rels\` (\`feature_toggles_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`feature_toggles\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`media_id\` integer,
  	\`reusable_blocks_id\` integer,
  	\`faq_groups_id\` integer,
  	\`form_submissions_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`tags_id\` integer,
  	\`authors_id\` integer,
  	\`playlists_id\` integer,
  	\`entitlements_id\` integer,
  	\`access_codes_id\` integer,
  	\`cities_id\` integer,
  	\`specialists_id\` integer,
  	\`social_posts_id\` integer,
  	\`comments_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`entitlements_id\`) REFERENCES \`entitlements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`access_codes_id\`) REFERENCES \`access_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`cities_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`specialists_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`social_posts_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`comments_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "media_id", "reusable_blocks_id", "faq_groups_id", "form_submissions_id", "articles_id", "threads_id", "tags_id", "authors_id", "playlists_id", "entitlements_id", "access_codes_id", "cities_id", "specialists_id", "social_posts_id", "comments_id", "users_id") SELECT "id", "order", "parent_id", "path", "pages_id", "media_id", "reusable_blocks_id", "faq_groups_id", "form_submissions_id", "articles_id", "threads_id", "tags_id", "authors_id", "playlists_id", "entitlements_id", "access_codes_id", "cities_id", "specialists_id", "social_posts_id", "comments_id", "users_id" FROM \`payload_locked_documents_rels\`;`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_reusable_blocks_id_idx\` ON \`payload_locked_documents_rels\` (\`reusable_blocks_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_playlists_id_idx\` ON \`payload_locked_documents_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_entitlements_id_idx\` ON \`payload_locked_documents_rels\` (\`entitlements_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_access_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`access_codes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_specialists_id_idx\` ON \`payload_locked_documents_rels\` (\`specialists_id\`);`,
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
}
