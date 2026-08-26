// @safe-bluegreen — только новые таблицы под блок, существующие данные не трогает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_video_set\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`playlist_id\` integer,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`layout\` text DEFAULT 'rows',
  	\`limit\` numeric,
  	\`show_link\` integer DEFAULT true,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_set_order_idx\` ON \`pages_blocks_video_set\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_set_parent_id_idx\` ON \`pages_blocks_video_set\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_set_path_idx\` ON \`pages_blocks_video_set\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_video_set_playlist_idx\` ON \`pages_blocks_video_set\` (\`playlist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_video_set\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`playlist_id\` integer,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`layout\` text DEFAULT 'rows',
  	\`limit\` numeric,
  	\`show_link\` integer DEFAULT true,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_set_order_idx\` ON \`_pages_v_blocks_video_set\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_set_parent_id_idx\` ON \`_pages_v_blocks_video_set\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_set_path_idx\` ON \`_pages_v_blocks_video_set\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_video_set_playlist_idx\` ON \`_pages_v_blocks_video_set\` (\`playlist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_video_set\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`playlist_id\` integer,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`layout\` text DEFAULT 'rows',
  	\`limit\` numeric,
  	\`show_link\` integer DEFAULT true,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_video_set_order_idx\` ON \`reusable_blocks_blocks_video_set\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_video_set_parent_id_idx\` ON \`reusable_blocks_blocks_video_set\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_video_set_path_idx\` ON \`reusable_blocks_blocks_video_set\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_video_set_playlist_idx\` ON \`reusable_blocks_blocks_video_set\` (\`playlist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_video_set\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`playlist_id\` integer,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`layout\` text DEFAULT 'rows',
  	\`limit\` numeric,
  	\`show_link\` integer DEFAULT true,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_video_set_order_idx\` ON \`_reusable_blocks_v_blocks_video_set\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_video_set_parent_id_idx\` ON \`_reusable_blocks_v_blocks_video_set\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_video_set_path_idx\` ON \`_reusable_blocks_v_blocks_video_set\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_video_set_playlist_idx\` ON \`_reusable_blocks_v_blocks_video_set\` (\`playlist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_video_set\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`playlist_id\` integer NOT NULL,
  	\`heading\` text,
  	\`subtitle\` text,
  	\`layout\` text DEFAULT 'rows',
  	\`limit\` numeric,
  	\`show_link\` integer DEFAULT true,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_video_set_order_idx\` ON \`specialists_blocks_video_set\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_video_set_parent_id_idx\` ON \`specialists_blocks_video_set\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_video_set_path_idx\` ON \`specialists_blocks_video_set\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_video_set_playlist_idx\` ON \`specialists_blocks_video_set\` (\`playlist_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_video_set\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_video_set\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_video_set\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_video_set\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_video_set\`;`);
}
