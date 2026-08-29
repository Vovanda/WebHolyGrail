// @needs-maintenance - таблица записей пересоздаётся: SQLite не умеет менять
// значение по умолчанию у колонки. Старый цвет в это время читает ту же базу.
//
// Перенос правлен руками: drizzle просил `visibility` из старой таблицы, где
// такой колонки ещё нет, и прогон падал на «no such column». Вместо неё
// подставлено значение по умолчанию - прежние записи становятся скрытыми,
// и витрина набирается решением, а не задним числом.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`is_dark\` integer,
  	\`derived\` integer DEFAULT false,
  	\`alt\` text,
  	\`preview_id\` integer,
  	\`preview_url\` text,
  	\`prefix\` text DEFAULT '',
  	\`caption\` text,
  	\`short_code\` text,
  	\`uploaded_by_id\` integer,
  	\`access\` text DEFAULT 'private',
  	\`visibility\` text DEFAULT 'hidden',
  	\`hls_status\` text DEFAULT 'pending',
  	\`hls_playlist_url\` text,
  	\`hls_prefix\` text,
  	\`hls_progress\` numeric,
  	\`hls_storyboard_url\` text,
  	\`hls_storyboard_columns\` numeric,
  	\`hls_storyboard_rows\` numeric,
  	\`hls_storyboard_count\` numeric,
  	\`hls_storyboard_frame_width\` numeric,
  	\`hls_storyboard_frame_height\` numeric,
  	\`hls_storyboard_interval_seconds\` numeric,
  	\`hls_pack_bytes\` numeric,
  	\`hls_duration_seconds\` numeric,
  	\`hls_secret\` text,
  	\`hls_deleted_at\` text,
  	\`hls_error\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text,
  	\`sizes_hero_url\` text,
  	\`sizes_hero_width\` numeric,
  	\`sizes_hero_height\` numeric,
  	\`sizes_hero_mime_type\` text,
  	\`sizes_hero_filesize\` numeric,
  	\`sizes_hero_filename\` text,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`uploaded_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_media\`("id", "title", "is_dark", "derived", "alt", "preview_id", "preview_url", "prefix", "caption", "short_code", "uploaded_by_id", "access", "visibility", "hls_status", "hls_playlist_url", "hls_prefix", "hls_progress", "hls_storyboard_url", "hls_storyboard_columns", "hls_storyboard_rows", "hls_storyboard_count", "hls_storyboard_frame_width", "hls_storyboard_frame_height", "hls_storyboard_interval_seconds", "hls_pack_bytes", "hls_duration_seconds", "hls_secret", "hls_deleted_at", "hls_error", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename") SELECT "id", "title", "is_dark", "derived", "alt", "preview_id", "preview_url", "prefix", "caption", "short_code", "uploaded_by_id", "access", 'hidden', "hls_status", "hls_playlist_url", "hls_prefix", "hls_progress", "hls_storyboard_url", "hls_storyboard_columns", "hls_storyboard_rows", "hls_storyboard_count", "hls_storyboard_frame_width", "hls_storyboard_frame_height", "hls_storyboard_interval_seconds", "hls_pack_bytes", "hls_duration_seconds", "hls_secret", "hls_deleted_at", "hls_error", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename" FROM \`media\`;`,
  );
  await db.run(sql`DROP TABLE \`media\`;`);
  await db.run(sql`ALTER TABLE \`__new_media\` RENAME TO \`media\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`media_title_idx\` ON \`media\` (\`title\`);`);
  await db.run(sql`CREATE INDEX \`media_derived_idx\` ON \`media\` (\`derived\`);`);
  await db.run(sql`CREATE INDEX \`media_preview_idx\` ON \`media\` (\`preview_id\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`media_short_code_idx\` ON \`media\` (\`short_code\`);`);
  await db.run(sql`CREATE INDEX \`media_uploaded_by_idx\` ON \`media\` (\`uploaded_by_id\`);`);
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`);
  await db.run(
    sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_hero_sizes_hero_filename_idx\` ON \`media\` (\`sizes_hero_filename\`);`,
  );
  await db.run(sql`ALTER TABLE \`playlists\` ADD \`visibility\` text DEFAULT 'hidden';`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`is_dark\` integer,
  	\`derived\` integer DEFAULT false,
  	\`alt\` text,
  	\`preview_id\` integer,
  	\`preview_url\` text,
  	\`prefix\` text DEFAULT '',
  	\`caption\` text,
  	\`short_code\` text,
  	\`uploaded_by_id\` integer,
  	\`access\` text DEFAULT 'public',
  	\`hls_status\` text DEFAULT 'pending',
  	\`hls_playlist_url\` text,
  	\`hls_prefix\` text,
  	\`hls_progress\` numeric,
  	\`hls_storyboard_url\` text,
  	\`hls_storyboard_columns\` numeric,
  	\`hls_storyboard_rows\` numeric,
  	\`hls_storyboard_count\` numeric,
  	\`hls_storyboard_frame_width\` numeric,
  	\`hls_storyboard_frame_height\` numeric,
  	\`hls_storyboard_interval_seconds\` numeric,
  	\`hls_pack_bytes\` numeric,
  	\`hls_duration_seconds\` numeric,
  	\`hls_secret\` text,
  	\`hls_deleted_at\` text,
  	\`hls_error\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`url\` text,
  	\`thumbnail_u_r_l\` text,
  	\`filename\` text,
  	\`mime_type\` text,
  	\`filesize\` numeric,
  	\`width\` numeric,
  	\`height\` numeric,
  	\`focal_x\` numeric,
  	\`focal_y\` numeric,
  	\`sizes_thumbnail_url\` text,
  	\`sizes_thumbnail_width\` numeric,
  	\`sizes_thumbnail_height\` numeric,
  	\`sizes_thumbnail_mime_type\` text,
  	\`sizes_thumbnail_filesize\` numeric,
  	\`sizes_thumbnail_filename\` text,
  	\`sizes_card_url\` text,
  	\`sizes_card_width\` numeric,
  	\`sizes_card_height\` numeric,
  	\`sizes_card_mime_type\` text,
  	\`sizes_card_filesize\` numeric,
  	\`sizes_card_filename\` text,
  	\`sizes_hero_url\` text,
  	\`sizes_hero_width\` numeric,
  	\`sizes_hero_height\` numeric,
  	\`sizes_hero_mime_type\` text,
  	\`sizes_hero_filesize\` numeric,
  	\`sizes_hero_filename\` text,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`uploaded_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_media\`("id", "title", "is_dark", "derived", "alt", "preview_id", "preview_url", "prefix", "caption", "short_code", "uploaded_by_id", "access", "hls_status", "hls_playlist_url", "hls_prefix", "hls_progress", "hls_storyboard_url", "hls_storyboard_columns", "hls_storyboard_rows", "hls_storyboard_count", "hls_storyboard_frame_width", "hls_storyboard_frame_height", "hls_storyboard_interval_seconds", "hls_pack_bytes", "hls_duration_seconds", "hls_secret", "hls_deleted_at", "hls_error", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename") SELECT "id", "title", "is_dark", "derived", "alt", "preview_id", "preview_url", "prefix", "caption", "short_code", "uploaded_by_id", "access", "hls_status", "hls_playlist_url", "hls_prefix", "hls_progress", "hls_storyboard_url", "hls_storyboard_columns", "hls_storyboard_rows", "hls_storyboard_count", "hls_storyboard_frame_width", "hls_storyboard_frame_height", "hls_storyboard_interval_seconds", "hls_pack_bytes", "hls_duration_seconds", "hls_secret", "hls_deleted_at", "hls_error", "updated_at", "created_at", "url", "thumbnail_u_r_l", "filename", "mime_type", "filesize", "width", "height", "focal_x", "focal_y", "sizes_thumbnail_url", "sizes_thumbnail_width", "sizes_thumbnail_height", "sizes_thumbnail_mime_type", "sizes_thumbnail_filesize", "sizes_thumbnail_filename", "sizes_card_url", "sizes_card_width", "sizes_card_height", "sizes_card_mime_type", "sizes_card_filesize", "sizes_card_filename", "sizes_hero_url", "sizes_hero_width", "sizes_hero_height", "sizes_hero_mime_type", "sizes_hero_filesize", "sizes_hero_filename" FROM \`media\`;`,
  );
  await db.run(sql`DROP TABLE \`media\`;`);
  await db.run(sql`ALTER TABLE \`__new_media\` RENAME TO \`media\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`media_title_idx\` ON \`media\` (\`title\`);`);
  await db.run(sql`CREATE INDEX \`media_derived_idx\` ON \`media\` (\`derived\`);`);
  await db.run(sql`CREATE INDEX \`media_preview_idx\` ON \`media\` (\`preview_id\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`media_short_code_idx\` ON \`media\` (\`short_code\`);`);
  await db.run(sql`CREATE INDEX \`media_uploaded_by_idx\` ON \`media\` (\`uploaded_by_id\`);`);
  await db.run(sql`CREATE INDEX \`media_updated_at_idx\` ON \`media\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`media_created_at_idx\` ON \`media\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`media_filename_idx\` ON \`media\` (\`filename\`);`);
  await db.run(
    sql`CREATE INDEX \`media_sizes_thumbnail_sizes_thumbnail_filename_idx\` ON \`media\` (\`sizes_thumbnail_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_card_sizes_card_filename_idx\` ON \`media\` (\`sizes_card_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_hero_sizes_hero_filename_idx\` ON \`media\` (\`sizes_hero_filename\`);`,
  );
  await db.run(sql`ALTER TABLE \`playlists\` DROP COLUMN \`visibility\`;`);
}
