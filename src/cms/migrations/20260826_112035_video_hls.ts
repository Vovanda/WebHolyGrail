// @safe-bluegreen — expand-only: новые колонки видео у media и таблицы
// качеств. Старый цвет о них не знает и не читает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`media_hls_qualities\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`height\` numeric,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`media_hls_qualities_order_idx\` ON \`media_hls_qualities\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_hls_qualities_parent_id_idx\` ON \`media_hls_qualities\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`site_settings_video_qualities\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`site_settings_video_qualities_order_idx\` ON \`site_settings_video_qualities\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`site_settings_video_qualities_parent_idx\` ON \`site_settings_video_qualities\` (\`parent_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`media\` ADD \`access\` text DEFAULT 'public';`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_status\` text DEFAULT 'pending';`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_playlist_url\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_prefix\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_duration_seconds\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_secret\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_error\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`media_hls_qualities\`;`);
  await db.run(sql`DROP TABLE \`site_settings_video_qualities\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`access\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_status\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_playlist_url\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_prefix\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_duration_seconds\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_secret\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_error\`;`);
}
