import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Comments — generic-коллекция комментов соц-постов. Source (vk/tg/ig) +
 * sourceId + post FK + parentId + date + text + author group + likes +
 * hidden + previewTitle + syncedAt + автоматические created_at / updated_at.
 *
 * Unique `(source, source_id)` — re-sync не дублирует.
 * FK `post_id` → posts(id) ON DELETE cascade (удаление поста уносит комменты).
 *
 * Плюс `payload_locked_documents_rels.comments_id` для polymorphic-relation
 * (как с posts_id ранее).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`comments\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`source\` text NOT NULL,
    \`source_id\` text NOT NULL,
    \`post_id\` integer NOT NULL,
    \`source_owner_id\` text,
    \`parent_id\` text DEFAULT '0',
    \`date\` integer NOT NULL,
    \`date_iso\` text,
    \`text\` text,
    \`author_type\` text,
    \`author_id\` text,
    \`author_name\` text,
    \`author_photo\` text,
    \`author_url\` text,
    \`likes\` integer DEFAULT 0,
    \`hidden\` integer DEFAULT false,
    \`preview_title\` text,
    \`synced_at\` text,
    \`updated_at\` text NOT NULL,
    \`created_at\` text NOT NULL,
    FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(sql`CREATE INDEX \`comments_source_id_idx\` ON \`comments\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_post_id_idx\` ON \`comments\` (\`post_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_date_idx\` ON \`comments\` (\`date\`);`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`comments_source_sourceid_idx\` ON \`comments\` (\`source\`, \`source_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`comments_updated_at_idx\` ON \`comments\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`comments_created_at_idx\` ON \`comments\` (\`created_at\`);`);

  // Polymorphic FK для payload_locked_documents
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`comments_id\` integer REFERENCES comments(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_comments_id_idx\` ON \`payload_locked_documents_rels\` (\`comments_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_comments_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`comments_id\`;`);
  await db.run(sql`DROP TABLE \`comments\`;`);
}
