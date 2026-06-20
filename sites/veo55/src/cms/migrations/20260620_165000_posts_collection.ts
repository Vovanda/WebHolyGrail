import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Posts collection — generic-социал-посты (R5++). Источник через `source`
 * (VK / TG / IG), per-источник `source_id`. Наполняется адаптерами
 * (`cms/src/lib/social/*`) через сидер `pnpm sync:vk-posts`.
 *
 * Без versioned — посты редко правятся вручную (резко-доминирует автоматический
 * sync). Если потребуется черновик-история — добавим `_posts_v_*` отдельной
 * миграцией.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`posts\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`source\` text NOT NULL,
    \`source_id\` text NOT NULL,
    \`source_owner_id\` text,
    \`source_url\` text NOT NULL,
    \`date\` integer NOT NULL,
    \`date_iso\` text,
    \`text\` text,
    \`author_type\` text,
    \`author_id\` text,
    \`author_name\` text,
    \`author_photo\` text,
    \`author_url\` text,
    \`metrics_likes\` integer DEFAULT 0,
    \`metrics_comments\` integer DEFAULT 0,
    \`metrics_reposts\` integer DEFAULT 0,
    \`metrics_views\` integer DEFAULT 0,
    \`preview_title\` text,
    \`synced_at\` text,
    \`updated_at\` text NOT NULL,
    \`created_at\` text NOT NULL
  );`);
  await db.run(sql`CREATE INDEX \`posts_source_id_idx\` ON \`posts\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`posts_date_idx\` ON \`posts\` (\`date\`);`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`posts_source_sourceid_idx\` ON \`posts\` (\`source\`, \`source_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`posts_updated_at_idx\` ON \`posts\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`posts_created_at_idx\` ON \`posts\` (\`created_at\`);`);

  await db.run(sql`CREATE TABLE \`posts_media\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`type\` text NOT NULL,
    \`url\` text NOT NULL,
    \`width\` integer,
    \`height\` integer,
    \`duration\` integer,
    \`title\` text,
    \`embed_url\` text,
    \`page_url\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(sql`CREATE INDEX \`posts_media_order_idx\` ON \`posts_media\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`posts_media_parent_id_idx\` ON \`posts_media\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`posts_mentions\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`start\` integer NOT NULL,
    \`end\` integer NOT NULL,
    \`type\` text NOT NULL,
    \`url\` text NOT NULL,
    \`display\` text NOT NULL,
    \`data\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(sql`CREATE INDEX \`posts_mentions_order_idx\` ON \`posts_mentions\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`posts_mentions_parent_id_idx\` ON \`posts_mentions\` (\`_parent_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`posts_mentions\`;`);
  await db.run(sql`DROP TABLE \`posts_media\`;`);
  await db.run(sql`DROP TABLE \`posts\`;`);
}
