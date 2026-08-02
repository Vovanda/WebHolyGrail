// @safe-bluegreen — только новые колонки знака фоном
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`watermark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`watermark_side\` text DEFAULT 'right';`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_watermark_idx\` ON \`pages_blocks_hero_cinematic\` (\`watermark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`watermark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`watermark_side\` text DEFAULT 'right';`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_watermark_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`watermark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`watermark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`watermark_side\` text DEFAULT 'right';`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_watermark_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`watermark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`watermark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`watermark_side\` text DEFAULT 'right';`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_watermark_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`watermark_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`watermark_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`watermark_side\` text DEFAULT 'right';`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_watermark_idx\` ON \`specialists_blocks_hero_cinematic\` (\`watermark_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_hero_cinematic\`("_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_hero_cinematic\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_hero_cinematic\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_hero_cinematic\` RENAME TO \`pages_blocks_hero_cinematic\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_order_idx\` ON \`pages_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_parent_id_idx\` ON \`pages_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_path_idx\` ON \`pages_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_cinematic_poster_idx\` ON \`pages_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_hero_cinematic\`("_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_hero_cinematic\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_cinematic\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_hero_cinematic\` RENAME TO \`_pages_v_blocks_hero_cinematic\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_order_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_parent_id_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_path_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_cinematic_poster_idx\` ON \`_pages_v_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_hero_cinematic\`("_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_hero_cinematic\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero_cinematic\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_hero_cinematic\` RENAME TO \`reusable_blocks_blocks_hero_cinematic\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_order_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_parent_id_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_path_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_cinematic_poster_idx\` ON \`reusable_blocks_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_hero_cinematic\`("_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_hero_cinematic\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero_cinematic\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_hero_cinematic\` RENAME TO \`_reusable_blocks_v_blocks_hero_cinematic\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_order_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_path_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_cinematic_poster_idx\` ON \`_reusable_blocks_v_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_specialists_blocks_hero_cinematic\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`video_url\` text,
  	\`poster_id\` integer,
  	\`brand\` text,
  	\`headline\` text,
  	\`highlight_label\` text,
  	\`highlight_href\` text,
  	\`quote\` text,
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`poster_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_specialists_blocks_hero_cinematic\`("_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "video_url", "poster_id", "brand", "headline", "highlight_label", "highlight_href", "quote", "cta_label", "cta_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`specialists_blocks_hero_cinematic\`;`,
  );
  await db.run(sql`DROP TABLE \`specialists_blocks_hero_cinematic\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_specialists_blocks_hero_cinematic\` RENAME TO \`specialists_blocks_hero_cinematic\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_order_idx\` ON \`specialists_blocks_hero_cinematic\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_parent_id_idx\` ON \`specialists_blocks_hero_cinematic\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_path_idx\` ON \`specialists_blocks_hero_cinematic\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_poster_idx\` ON \`specialists_blocks_hero_cinematic\` (\`poster_id\`);`,
  );
}
