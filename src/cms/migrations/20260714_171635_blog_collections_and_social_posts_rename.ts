import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @needs-maintenance — posts* переименованы в social_posts* (#50), не expand-only.

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`posts\` RENAME TO \`social_posts\`;`);
  await db.run(sql`ALTER TABLE \`posts_media\` RENAME TO \`social_posts_media\`;`);
  await db.run(sql`ALTER TABLE \`posts_mentions\` RENAME TO \`social_posts_mentions\`;`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` RENAME COLUMN \`posts_id\` TO \`social_posts_id\`;`,
  );
  await db.run(sql`CREATE TABLE \`articles\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`title\` text,
	\`subtitle\` text,
	\`slug\` text,
	\`lead\` text,
	\`cover_id\` integer,
	\`body\` text,
	\`status\` text DEFAULT 'draft',
	\`published_at\` text,
	\`thread_id\` integer,
	\`author_id\` integer,
	\`reading_time\` numeric,
	\`display_overrides_show_author\` integer,
	\`display_overrides_show_date\` integer,
	\`display_overrides_show_reading_time\` integer,
	\`display_overrides_show_tags\` integer,
	\`seo_title\` text,
	\`seo_description\` text,
	\`seo_og_image_id\` integer,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`_status\` text DEFAULT 'draft',
	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`thread_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`author_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(sql`CREATE UNIQUE INDEX \`articles_slug_idx\` ON \`articles\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`articles_cover_idx\` ON \`articles\` (\`cover_id\`);`);
  await db.run(sql`CREATE INDEX \`articles_status_idx\` ON \`articles\` (\`status\`);`);
  await db.run(sql`CREATE INDEX \`articles_published_at_idx\` ON \`articles\` (\`published_at\`);`);
  await db.run(sql`CREATE INDEX \`articles_thread_idx\` ON \`articles\` (\`thread_id\`);`);
  await db.run(sql`CREATE INDEX \`articles_author_idx\` ON \`articles\` (\`author_id\`);`);
  await db.run(
    sql`CREATE INDEX \`articles_seo_seo_og_image_idx\` ON \`articles\` (\`seo_og_image_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`articles_updated_at_idx\` ON \`articles\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`articles_created_at_idx\` ON \`articles\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`articles__status_idx\` ON \`articles\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`articles_rels\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`order\` integer,
	\`parent_id\` integer NOT NULL,
	\`path\` text NOT NULL,
	\`tags_id\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(sql`CREATE INDEX \`articles_rels_order_idx\` ON \`articles_rels\` (\`order\`);`);
  await db.run(
    sql`CREATE INDEX \`articles_rels_parent_idx\` ON \`articles_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`articles_rels_path_idx\` ON \`articles_rels\` (\`path\`);`);
  await db.run(sql`CREATE INDEX \`articles_rels_tags_id_idx\` ON \`articles_rels\` (\`tags_id\`);`);
  await db.run(sql`CREATE TABLE \`_articles_v\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`parent_id\` integer,
	\`version_title\` text,
	\`version_subtitle\` text,
	\`version_slug\` text,
	\`version_lead\` text,
	\`version_cover_id\` integer,
	\`version_body\` text,
	\`version_status\` text DEFAULT 'draft',
	\`version_published_at\` text,
	\`version_thread_id\` integer,
	\`version_author_id\` integer,
	\`version_reading_time\` numeric,
	\`version_display_overrides_show_author\` integer,
	\`version_display_overrides_show_date\` integer,
	\`version_display_overrides_show_reading_time\` integer,
	\`version_display_overrides_show_tags\` integer,
	\`version_seo_title\` text,
	\`version_seo_description\` text,
	\`version_seo_og_image_id\` integer,
	\`version_updated_at\` text,
	\`version_created_at\` text,
	\`version__status\` text DEFAULT 'draft',
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`latest\` integer,
	\`autosave\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_thread_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_author_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(sql`CREATE INDEX \`_articles_v_parent_idx\` ON \`_articles_v\` (\`parent_id\`);`);
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_slug_idx\` ON \`_articles_v\` (\`version_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_cover_idx\` ON \`_articles_v\` (\`version_cover_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_status_idx\` ON \`_articles_v\` (\`version_status\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_published_at_idx\` ON \`_articles_v\` (\`version_published_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_thread_idx\` ON \`_articles_v\` (\`version_thread_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_author_idx\` ON \`_articles_v\` (\`version_author_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_seo_version_seo_og_image_idx\` ON \`_articles_v\` (\`version_seo_og_image_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_updated_at_idx\` ON \`_articles_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version_created_at_idx\` ON \`_articles_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_version_version__status_idx\` ON \`_articles_v\` (\`version__status\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_created_at_idx\` ON \`_articles_v\` (\`created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_updated_at_idx\` ON \`_articles_v\` (\`updated_at\`);`,
  );
  await db.run(sql`CREATE INDEX \`_articles_v_latest_idx\` ON \`_articles_v\` (\`latest\`);`);
  await db.run(sql`CREATE INDEX \`_articles_v_autosave_idx\` ON \`_articles_v\` (\`autosave\`);`);
  await db.run(sql`CREATE TABLE \`_articles_v_rels\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`order\` integer,
	\`parent_id\` integer NOT NULL,
	\`path\` text NOT NULL,
	\`tags_id\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`_articles_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`CREATE INDEX \`_articles_v_rels_order_idx\` ON \`_articles_v_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_articles_v_rels_parent_idx\` ON \`_articles_v_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`_articles_v_rels_path_idx\` ON \`_articles_v_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`_articles_v_rels_tags_id_idx\` ON \`_articles_v_rels\` (\`tags_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`threads\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`slug\` text,
	\`description\` text,
	\`cover_id\` integer,
	\`status\` text DEFAULT 'draft',
	\`order\` numeric,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`cover_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(sql`CREATE UNIQUE INDEX \`threads_slug_idx\` ON \`threads\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`threads_cover_idx\` ON \`threads\` (\`cover_id\`);`);
  await db.run(sql`CREATE INDEX \`threads_status_idx\` ON \`threads\` (\`status\`);`);
  await db.run(sql`CREATE INDEX \`threads_updated_at_idx\` ON \`threads\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`threads_created_at_idx\` ON \`threads\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`tags\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	\`slug\` text,
	\`color\` text,
	\`description\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
`);
  await db.run(sql`CREATE UNIQUE INDEX \`tags_slug_idx\` ON \`tags\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`tags_updated_at_idx\` ON \`tags\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`tags_created_at_idx\` ON \`tags\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`authors_links\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`label\` text NOT NULL,
	\`url\` text NOT NULL,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(sql`CREATE INDEX \`authors_links_order_idx\` ON \`authors_links\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`authors_links_parent_id_idx\` ON \`authors_links\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`authors\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`slug\` text,
	\`bio\` text,
	\`avatar_id\` integer,
	\`role\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`avatar_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(sql`CREATE UNIQUE INDEX \`authors_slug_idx\` ON \`authors\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`authors_avatar_idx\` ON \`authors\` (\`avatar_id\`);`);
  await db.run(sql`CREATE INDEX \`authors_updated_at_idx\` ON \`authors\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`authors_created_at_idx\` ON \`authors\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`payload_jobs_log\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`executed_at\` text NOT NULL,
	\`completed_at\` text NOT NULL,
	\`task_slug\` text NOT NULL,
	\`task_i_d\` text NOT NULL,
	\`input\` text,
	\`output\` text,
	\`state\` text NOT NULL,
	\`error\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`payload_jobs\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`CREATE INDEX \`payload_jobs_log_order_idx\` ON \`payload_jobs_log\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_log_parent_id_idx\` ON \`payload_jobs_log\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`payload_jobs\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`input\` text,
	\`completed_at\` text,
	\`total_tried\` numeric DEFAULT 0,
	\`has_error\` integer DEFAULT false,
	\`error\` text,
	\`task_slug\` text,
	\`queue\` text DEFAULT 'default',
	\`wait_until\` text,
	\`processing\` integer DEFAULT false,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
`);
  await db.run(
    sql`CREATE INDEX \`payload_jobs_completed_at_idx\` ON \`payload_jobs\` (\`completed_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_total_tried_idx\` ON \`payload_jobs\` (\`total_tried\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_has_error_idx\` ON \`payload_jobs\` (\`has_error\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_task_slug_idx\` ON \`payload_jobs\` (\`task_slug\`);`,
  );
  await db.run(sql`CREATE INDEX \`payload_jobs_queue_idx\` ON \`payload_jobs\` (\`queue\`);`);
  await db.run(
    sql`CREATE INDEX \`payload_jobs_wait_until_idx\` ON \`payload_jobs\` (\`wait_until\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_processing_idx\` ON \`payload_jobs\` (\`processing\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_updated_at_idx\` ON \`payload_jobs\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_created_at_idx\` ON \`payload_jobs\` (\`created_at\`);`,
  );
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_social_posts_media\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`type\` text NOT NULL,
	\`url\` text NOT NULL,
	\`width\` numeric,
	\`height\` numeric,
	\`duration\` numeric,
	\`title\` text,
	\`embed_url\` text,
	\`page_url\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`INSERT INTO \`__new_social_posts_media\`("_order", "_parent_id", "id", "type", "url", "width", "height", "duration", "title", "embed_url", "page_url") SELECT "_order", "_parent_id", "id", "type", "url", "width", "height", "duration", "title", "embed_url", "page_url" FROM \`social_posts_media\`;`,
  );
  await db.run(sql`DROP TABLE \`social_posts_media\`;`);
  await db.run(sql`ALTER TABLE \`__new_social_posts_media\` RENAME TO \`social_posts_media\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`social_posts_media_order_idx\` ON \`social_posts_media\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`social_posts_media_parent_id_idx\` ON \`social_posts_media\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_social_posts_mentions\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`start\` numeric NOT NULL,
	\`end\` numeric NOT NULL,
	\`type\` text NOT NULL,
	\`url\` text NOT NULL,
	\`display\` text NOT NULL,
	\`data\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`INSERT INTO \`__new_social_posts_mentions\`("_order", "_parent_id", "id", "start", "end", "type", "url", "display", "data") SELECT "_order", "_parent_id", "id", "start", "end", "type", "url", "display", "data" FROM \`social_posts_mentions\`;`,
  );
  await db.run(sql`DROP TABLE \`social_posts_mentions\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_social_posts_mentions\` RENAME TO \`social_posts_mentions\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`social_posts_mentions_order_idx\` ON \`social_posts_mentions\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`social_posts_mentions_parent_id_idx\` ON \`social_posts_mentions\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_comments\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`source\` text NOT NULL,
	\`source_id\` text NOT NULL,
	\`post_id\` integer NOT NULL,
	\`source_owner_id\` text,
	\`parent_id\` text DEFAULT '0',
	\`date\` numeric NOT NULL,
	\`date_iso\` text,
	\`text\` text,
	\`author_type\` text,
	\`author_name\` text,
	\`author_photo\` text,
	\`author_url\` text,
	\`likes\` numeric DEFAULT 0,
	\`hidden\` integer DEFAULT false,
	\`preview_title\` text,
	\`synced_at\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`post_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(
    sql`INSERT INTO \`__new_comments\`("id", "source", "source_id", "post_id", "source_owner_id", "parent_id", "date", "date_iso", "text", "author_type", "author_name", "author_photo", "author_url", "likes", "hidden", "preview_title", "synced_at", "updated_at", "created_at") SELECT "id", "source", "source_id", "post_id", "source_owner_id", "parent_id", "date", "date_iso", "text", "author_type", "author_name", "author_photo", "author_url", "likes", "hidden", "preview_title", "synced_at", "updated_at", "created_at" FROM \`comments\`;`,
  );
  await db.run(sql`DROP TABLE \`comments\`;`);
  await db.run(sql`ALTER TABLE \`__new_comments\` RENAME TO \`comments\`;`);
  await db.run(sql`CREATE INDEX \`comments_source_id_idx\` ON \`comments\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_post_idx\` ON \`comments\` (\`post_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_date_idx\` ON \`comments\` (\`date\`);`);
  await db.run(sql`CREATE INDEX \`comments_updated_at_idx\` ON \`comments\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`comments_created_at_idx\` ON \`comments\` (\`created_at\`);`);
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
	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id" FROM \`payload_locked_documents_rels\`;`,
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
  await db.run(sql`DROP INDEX \`posts_source_id_idx\`;`);
  await db.run(sql`DROP INDEX \`posts_date_idx\`;`);
  await db.run(sql`DROP INDEX \`posts_updated_at_idx\`;`);
  await db.run(sql`DROP INDEX \`posts_created_at_idx\`;`);
  await db.run(
    sql`CREATE INDEX \`social_posts_source_id_idx\` ON \`social_posts\` (\`source_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`social_posts_date_idx\` ON \`social_posts\` (\`date\`);`);
  await db.run(
    sql`CREATE INDEX \`social_posts_updated_at_idx\` ON \`social_posts\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`social_posts_created_at_idx\` ON \`social_posts\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_users\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`name\` text,
	\`role\` text DEFAULT 'admin',
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`email\` text NOT NULL,
	\`reset_password_token\` text,
	\`reset_password_expiration\` text,
	\`salt\` text,
	\`hash\` text,
	\`login_attempts\` numeric DEFAULT 0,
	\`lock_until\` text
);
`);
  await db.run(
    sql`INSERT INTO \`__new_users\`("id", "name", "role", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until") SELECT "id", "name", "role", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until" FROM \`users\`;`,
  );
  await db.run(sql`DROP TABLE \`users\`;`);
  await db.run(sql`ALTER TABLE \`__new_users\` RENAME TO \`users\`;`);
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`);
  await db.run(sql`CREATE TABLE \`__new_site_settings\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`site_name\` text DEFAULT 'Web Holy Grail' NOT NULL,
	\`logo_id\` integer,
	\`contacts_phone\` text,
	\`contacts_email\` text,
	\`contacts_address\` text,
	\`contacts_hours\` text,
	\`contacts_map_embed_url\` text,
	\`theme_mode\` text DEFAULT 'light' NOT NULL,
	\`theme_user_toggle\` integer DEFAULT true,
	\`theme_palette_preset\` text DEFAULT 'whg-default',
	\`theme_palette_light_primary\` text,
	\`theme_palette_light_primary_hover\` text,
	\`theme_palette_light_foreground\` text,
	\`theme_palette_light_foreground_muted\` text,
	\`theme_palette_light_background\` text,
	\`theme_palette_light_surface\` text,
	\`theme_palette_light_success\` text,
	\`theme_palette_light_danger\` text,
	\`theme_palette_dark_primary\` text,
	\`theme_palette_dark_primary_hover\` text,
	\`theme_palette_dark_foreground\` text,
	\`theme_palette_dark_foreground_muted\` text,
	\`theme_palette_dark_background\` text,
	\`theme_palette_dark_surface\` text,
	\`theme_palette_dark_success\` text,
	\`theme_palette_dark_danger\` text,
	\`layout\` text,
	\`blog_show_author\` integer DEFAULT true,
	\`blog_show_date\` integer DEFAULT true,
	\`blog_show_reading_time\` integer DEFAULT true,
	\`blog_show_tags\` integer DEFAULT true,
	\`blog_posts_per_page\` numeric DEFAULT 10,
	\`blog_default_sort\` text DEFAULT 'newest',
	\`updated_at\` text,
	\`created_at\` text,
	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(
    sql`INSERT INTO \`__new_site_settings\`("id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "theme_palette_preset", "theme_palette_light_primary", "theme_palette_light_primary_hover", "theme_palette_light_foreground", "theme_palette_light_foreground_muted", "theme_palette_light_background", "theme_palette_light_surface", "theme_palette_light_success", "theme_palette_light_danger", "theme_palette_dark_primary", "theme_palette_dark_primary_hover", "theme_palette_dark_foreground", "theme_palette_dark_foreground_muted", "theme_palette_dark_background", "theme_palette_dark_surface", "theme_palette_dark_success", "theme_palette_dark_danger", "layout", "updated_at", "created_at") SELECT "id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "theme_palette_preset", "theme_palette_light_primary", "theme_palette_light_primary_hover", "theme_palette_light_foreground", "theme_palette_light_foreground_muted", "theme_palette_light_background", "theme_palette_light_surface", "theme_palette_light_success", "theme_palette_light_danger", "theme_palette_dark_primary", "theme_palette_dark_primary_hover", "theme_palette_dark_foreground", "theme_palette_dark_foreground_muted", "theme_palette_dark_background", "theme_palette_dark_surface", "theme_palette_dark_success", "theme_palette_dark_danger", "layout", "updated_at", "created_at" FROM \`site_settings\`;`,
  );
  await db.run(sql`DROP TABLE \`site_settings\`;`);
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`);
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`articles\`;`);
  await db.run(sql`DROP TABLE \`articles_rels\`;`);
  await db.run(sql`DROP TABLE \`_articles_v\`;`);
  await db.run(sql`DROP TABLE \`_articles_v_rels\`;`);
  await db.run(sql`DROP TABLE \`threads\`;`);
  await db.run(sql`DROP TABLE \`tags\`;`);
  await db.run(sql`DROP TABLE \`authors_links\`;`);
  await db.run(sql`DROP TABLE \`authors\`;`);
  await db.run(sql`DROP TABLE \`payload_jobs_log\`;`);
  await db.run(sql`DROP TABLE \`payload_jobs\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_social_posts_media\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`type\` text NOT NULL,
	\`url\` text NOT NULL,
	\`width\` numeric,
	\`height\` numeric,
	\`duration\` numeric,
	\`title\` text,
	\`embed_url\` text,
	\`page_url\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`INSERT INTO \`__new_social_posts_media\`("_order", "_parent_id", "id", "type", "url", "width", "height", "duration", "title", "embed_url", "page_url") SELECT "_order", "_parent_id", "id", "type", "url", "width", "height", "duration", "title", "embed_url", "page_url" FROM \`social_posts_media\`;`,
  );
  await db.run(sql`DROP TABLE \`social_posts_media\`;`);
  await db.run(sql`ALTER TABLE \`__new_social_posts_media\` RENAME TO \`social_posts_media\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`posts_media_order_idx\` ON \`social_posts_media\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`posts_media_parent_id_idx\` ON \`social_posts_media\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_social_posts_mentions\` (
	\`_order\` integer NOT NULL,
	\`_parent_id\` integer NOT NULL,
	\`id\` text PRIMARY KEY NOT NULL,
	\`start\` numeric NOT NULL,
	\`end\` numeric NOT NULL,
	\`type\` text NOT NULL,
	\`url\` text NOT NULL,
	\`display\` text NOT NULL,
	\`data\` text,
	FOREIGN KEY (\`_parent_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`INSERT INTO \`__new_social_posts_mentions\`("_order", "_parent_id", "id", "start", "end", "type", "url", "display", "data") SELECT "_order", "_parent_id", "id", "start", "end", "type", "url", "display", "data" FROM \`social_posts_mentions\`;`,
  );
  await db.run(sql`DROP TABLE \`social_posts_mentions\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_social_posts_mentions\` RENAME TO \`social_posts_mentions\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`posts_mentions_order_idx\` ON \`social_posts_mentions\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`posts_mentions_parent_id_idx\` ON \`social_posts_mentions\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_comments\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`source\` text NOT NULL,
	\`source_id\` text NOT NULL,
	\`post_id\` integer NOT NULL,
	\`source_owner_id\` text,
	\`parent_id\` text DEFAULT '0',
	\`date\` numeric NOT NULL,
	\`date_iso\` text,
	\`text\` text,
	\`author_type\` text,
	\`author_name\` text,
	\`author_photo\` text,
	\`author_url\` text,
	\`likes\` numeric DEFAULT 0,
	\`hidden\` integer DEFAULT false,
	\`preview_title\` text,
	\`synced_at\` text,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (\`post_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(
    sql`INSERT INTO \`__new_comments\`("id", "source", "source_id", "post_id", "source_owner_id", "parent_id", "date", "date_iso", "text", "author_type", "author_name", "author_photo", "author_url", "likes", "hidden", "preview_title", "synced_at", "updated_at", "created_at") SELECT "id", "source", "source_id", "post_id", "source_owner_id", "parent_id", "date", "date_iso", "text", "author_type", "author_name", "author_photo", "author_url", "likes", "hidden", "preview_title", "synced_at", "updated_at", "created_at" FROM \`comments\`;`,
  );
  await db.run(sql`DROP TABLE \`comments\`;`);
  await db.run(sql`ALTER TABLE \`__new_comments\` RENAME TO \`comments\`;`);
  await db.run(sql`CREATE INDEX \`comments_source_id_idx\` ON \`comments\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_post_idx\` ON \`comments\` (\`post_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_date_idx\` ON \`comments\` (\`date\`);`);
  await db.run(sql`CREATE INDEX \`comments_updated_at_idx\` ON \`comments\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`comments_created_at_idx\` ON \`comments\` (\`created_at\`);`);
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
	\`comments_id\` integer,
	\`faq_groups_id\` integer,
	\`social_posts_id\` integer,
	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`posts_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`comments_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
`);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "comments_id", "faq_groups_id", "social_posts_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "comments_id", "faq_groups_id", "social_posts_id" FROM \`payload_locked_documents_rels\`;`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_comments_id_idx\` ON \`payload_locked_documents_rels\` (\`comments_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`DROP INDEX \`social_posts_source_id_idx\`;`);
  await db.run(sql`DROP INDEX \`social_posts_date_idx\`;`);
  await db.run(sql`DROP INDEX \`social_posts_updated_at_idx\`;`);
  await db.run(sql`DROP INDEX \`social_posts_created_at_idx\`;`);
  await db.run(sql`CREATE INDEX \`posts_source_id_idx\` ON \`social_posts\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`posts_date_idx\` ON \`social_posts\` (\`date\`);`);
  await db.run(sql`CREATE INDEX \`posts_updated_at_idx\` ON \`social_posts\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`posts_created_at_idx\` ON \`social_posts\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`__new_users\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`name\` text,
	\`role\` text DEFAULT 'editor' NOT NULL,
	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	\`email\` text NOT NULL,
	\`reset_password_token\` text,
	\`reset_password_expiration\` text,
	\`salt\` text,
	\`hash\` text,
	\`login_attempts\` numeric DEFAULT 0,
	\`lock_until\` text
);
`);
  await db.run(
    sql`INSERT INTO \`__new_users\`("id", "name", "role", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until") SELECT "id", "name", "role", "updated_at", "created_at", "email", "reset_password_token", "reset_password_expiration", "salt", "hash", "login_attempts", "lock_until" FROM \`users\`;`,
  );
  await db.run(sql`DROP TABLE \`users\`;`);
  await db.run(sql`ALTER TABLE \`__new_users\` RENAME TO \`users\`;`);
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`);
  await db.run(sql`CREATE TABLE \`__new_site_settings\` (
	\`id\` integer PRIMARY KEY NOT NULL,
	\`site_name\` text DEFAULT 'Web Holy Grail' NOT NULL,
	\`logo_id\` integer,
	\`contacts_phone\` text,
	\`contacts_email\` text,
	\`contacts_address\` text,
	\`contacts_hours\` text,
	\`contacts_map_embed_url\` text,
	\`theme_mode\` text DEFAULT 'light' NOT NULL,
	\`theme_user_toggle\` integer DEFAULT false,
	\`theme_palette_preset\` text DEFAULT 'whg-default',
	\`theme_palette_light_primary\` text,
	\`theme_palette_light_primary_hover\` text,
	\`theme_palette_light_foreground\` text,
	\`theme_palette_light_foreground_muted\` text,
	\`theme_palette_light_background\` text,
	\`theme_palette_light_surface\` text,
	\`theme_palette_light_success\` text,
	\`theme_palette_light_danger\` text,
	\`theme_palette_dark_primary\` text,
	\`theme_palette_dark_primary_hover\` text,
	\`theme_palette_dark_foreground\` text,
	\`theme_palette_dark_foreground_muted\` text,
	\`theme_palette_dark_background\` text,
	\`theme_palette_dark_surface\` text,
	\`theme_palette_dark_success\` text,
	\`theme_palette_dark_danger\` text,
	\`layout\` text,
	\`updated_at\` text,
	\`created_at\` text,
	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
);
`);
  await db.run(
    sql`INSERT INTO \`__new_site_settings\`("id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "theme_palette_preset", "theme_palette_light_primary", "theme_palette_light_primary_hover", "theme_palette_light_foreground", "theme_palette_light_foreground_muted", "theme_palette_light_background", "theme_palette_light_surface", "theme_palette_light_success", "theme_palette_light_danger", "theme_palette_dark_primary", "theme_palette_dark_primary_hover", "theme_palette_dark_foreground", "theme_palette_dark_foreground_muted", "theme_palette_dark_background", "theme_palette_dark_surface", "theme_palette_dark_success", "theme_palette_dark_danger", "layout", "updated_at", "created_at") SELECT "id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "theme_palette_preset", "theme_palette_light_primary", "theme_palette_light_primary_hover", "theme_palette_light_foreground", "theme_palette_light_foreground_muted", "theme_palette_light_background", "theme_palette_light_surface", "theme_palette_light_success", "theme_palette_light_danger", "theme_palette_dark_primary", "theme_palette_dark_primary_hover", "theme_palette_dark_foreground", "theme_palette_dark_foreground_muted", "theme_palette_dark_background", "theme_palette_dark_surface", "theme_palette_dark_success", "theme_palette_dark_danger", "layout", "updated_at", "created_at" FROM \`site_settings\`;`,
  );
  await db.run(sql`DROP TABLE \`site_settings\`;`);
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`);
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` RENAME COLUMN \`social_posts_id\` TO \`posts_id\`;`,
  );
  await db.run(sql`ALTER TABLE \`social_posts_mentions\` RENAME TO \`posts_mentions\`;`);
  await db.run(sql`ALTER TABLE \`social_posts_media\` RENAME TO \`posts_media\`;`);
  await db.run(sql`ALTER TABLE \`social_posts\` RENAME TO \`posts\`;`);
}
