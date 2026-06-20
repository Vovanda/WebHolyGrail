import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_reusable_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ref_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`ref_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_reusable_ref_order_idx\` ON \`pages_blocks_reusable_ref\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_reusable_ref_parent_id_idx\` ON \`pages_blocks_reusable_ref\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_reusable_ref_path_idx\` ON \`pages_blocks_reusable_ref\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_reusable_ref_ref_idx\` ON \`pages_blocks_reusable_ref\` (\`ref_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_page_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ref_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`ref_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_page_ref_order_idx\` ON \`pages_blocks_page_ref\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_page_ref_parent_id_idx\` ON \`pages_blocks_page_ref\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_page_ref_path_idx\` ON \`pages_blocks_page_ref\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_page_ref_ref_idx\` ON \`pages_blocks_page_ref\` (\`ref_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_reusable_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ref_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`ref_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_reusable_ref_order_idx\` ON \`_pages_v_blocks_reusable_ref\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_reusable_ref_parent_id_idx\` ON \`_pages_v_blocks_reusable_ref\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_reusable_ref_path_idx\` ON \`_pages_v_blocks_reusable_ref\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_reusable_ref_ref_idx\` ON \`_pages_v_blocks_reusable_ref\` (\`ref_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_page_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ref_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`ref_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_page_ref_order_idx\` ON \`_pages_v_blocks_page_ref\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_page_ref_parent_id_idx\` ON \`_pages_v_blocks_page_ref\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_page_ref_path_idx\` ON \`_pages_v_blocks_page_ref\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_page_ref_ref_idx\` ON \`_pages_v_blocks_page_ref\` (\`ref_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_banner_slider_banners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_url\` text,
  	\`alt\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_banner_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_banner_slider_banners_order_idx\` ON \`reusable_blocks_blocks_banner_slider_banners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_banner_slider_banners_parent_id_idx\` ON \`reusable_blocks_blocks_banner_slider_banners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_banner_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_banner_slider_order_idx\` ON \`reusable_blocks_blocks_banner_slider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_banner_slider_parent_id_idx\` ON \`reusable_blocks_blocks_banner_slider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_banner_slider_path_idx\` ON \`reusable_blocks_blocks_banner_slider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Щенки {accent} с документами РКФ',
  	\`title_accent\` text DEFAULT 'ВЕО',
  	\`subtitle\` text DEFAULT 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
  	\`subtitle_short\` text DEFAULT 'Питомник ВЕО «Омская Дружина» · г. Омск',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_order_idx\` ON \`reusable_blocks_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_parent_id_idx\` ON \`reusable_blocks_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_path_idx\` ON \`reusable_blocks_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_quote_photo_urls\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_quote\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_photo_urls_order_idx\` ON \`reusable_blocks_blocks_quote_photo_urls\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_photo_urls_parent_id_idx\` ON \`reusable_blocks_blocks_quote_photo_urls\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'О нас',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_order_idx\` ON \`reusable_blocks_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_parent_id_idx\` ON \`reusable_blocks_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_path_idx\` ON \`reusable_blocks_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_timeline_entries\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text,
  	\`icon\` text,
  	\`body\` text,
  	\`hidden\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_timeline\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_timeline_entries_order_idx\` ON \`reusable_blocks_blocks_timeline_entries\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_timeline_entries_parent_id_idx\` ON \`reusable_blocks_blocks_timeline_entries\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_timeline\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Наш путь',
  	\`visible_count\` numeric DEFAULT 3,
  	\`sort\` text DEFAULT 'year-desc',
  	\`variant\` text DEFAULT 'editorial-dots',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_timeline_order_idx\` ON \`reusable_blocks_blocks_timeline\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_timeline_parent_id_idx\` ON \`reusable_blocks_blocks_timeline\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_timeline_path_idx\` ON \`reusable_blocks_blocks_timeline\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_prose\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`body\` text,
  	\`variant\` text DEFAULT 'editorial-with-dropcap',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_prose_order_idx\` ON \`reusable_blocks_blocks_prose\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_prose_parent_id_idx\` ON \`reusable_blocks_blocks_prose\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_prose_path_idx\` ON \`reusable_blocks_blocks_prose\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_wave_divider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`flipped\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_wave_divider_order_idx\` ON \`reusable_blocks_blocks_wave_divider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_wave_divider_parent_id_idx\` ON \`reusable_blocks_blocks_wave_divider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_wave_divider_path_idx\` ON \`reusable_blocks_blocks_wave_divider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_litter_card\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`show_sold\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_card_order_idx\` ON \`reusable_blocks_blocks_litter_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_card_parent_id_idx\` ON \`reusable_blocks_blocks_litter_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_card_path_idx\` ON \`reusable_blocks_blocks_litter_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_card_litter_idx\` ON \`reusable_blocks_blocks_litter_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_litter_header\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_header_order_idx\` ON \`reusable_blocks_blocks_litter_header\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_header_parent_id_idx\` ON \`reusable_blocks_blocks_litter_header\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_header_path_idx\` ON \`reusable_blocks_blocks_litter_header\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_header_litter_idx\` ON \`reusable_blocks_blocks_litter_header\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_litter_pair_card\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_pair_card_order_idx\` ON \`reusable_blocks_blocks_litter_pair_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_pair_card_parent_id_idx\` ON \`reusable_blocks_blocks_litter_pair_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_pair_card_path_idx\` ON \`reusable_blocks_blocks_litter_pair_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_pair_card_litter_idx\` ON \`reusable_blocks_blocks_litter_pair_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_litter_puppies\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`show_sold\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_puppies_order_idx\` ON \`reusable_blocks_blocks_litter_puppies\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_puppies_parent_id_idx\` ON \`reusable_blocks_blocks_litter_puppies\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_puppies_path_idx\` ON \`reusable_blocks_blocks_litter_puppies\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_litter_puppies_litter_idx\` ON \`reusable_blocks_blocks_litter_puppies\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_achievement_banner_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_achievement_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_achievement_banner_items_order_idx\` ON \`reusable_blocks_blocks_achievement_banner_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_achievement_banner_items_parent_id_idx\` ON \`reusable_blocks_blocks_achievement_banner_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_achievement_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT '🏆',
  	\`title\` text,
  	\`title_suffix\` text,
  	\`description\` text,
  	\`accent\` text DEFAULT 'amber',
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_achievement_banner_order_idx\` ON \`reusable_blocks_blocks_achievement_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_achievement_banner_parent_id_idx\` ON \`reusable_blocks_blocks_achievement_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_achievement_banner_path_idx\` ON \`reusable_blocks_blocks_achievement_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_updated_at_idx\` ON \`reusable_blocks\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_created_at_idx\` ON \`reusable_blocks\` (\`created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks__status_idx\` ON \`reusable_blocks\` (\`_status\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_banner_slider_banners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_url\` text,
  	\`alt\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_banner_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_banner_slider_banners_order_idx\` ON \`_reusable_blocks_v_blocks_banner_slider_banners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_banner_slider_banners_parent_id_idx\` ON \`_reusable_blocks_v_blocks_banner_slider_banners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_banner_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_banner_slider_order_idx\` ON \`_reusable_blocks_v_blocks_banner_slider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_banner_slider_parent_id_idx\` ON \`_reusable_blocks_v_blocks_banner_slider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_banner_slider_path_idx\` ON \`_reusable_blocks_v_blocks_banner_slider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Щенки {accent} с документами РКФ',
  	\`title_accent\` text DEFAULT 'ВЕО',
  	\`subtitle\` text DEFAULT 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
  	\`subtitle_short\` text DEFAULT 'Питомник ВЕО «Омская Дружина» · г. Омск',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_order_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_path_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_quote_photo_urls\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`url\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_quote\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_photo_urls_order_idx\` ON \`_reusable_blocks_v_blocks_quote_photo_urls\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_photo_urls_parent_id_idx\` ON \`_reusable_blocks_v_blocks_quote_photo_urls\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'О нас',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_order_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_parent_id_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_path_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_timeline_entries\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`year\` text,
  	\`icon\` text,
  	\`body\` text,
  	\`hidden\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_timeline\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_timeline_entries_order_idx\` ON \`_reusable_blocks_v_blocks_timeline_entries\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_timeline_entries_parent_id_idx\` ON \`_reusable_blocks_v_blocks_timeline_entries\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_timeline\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Наш путь',
  	\`visible_count\` numeric DEFAULT 3,
  	\`sort\` text DEFAULT 'year-desc',
  	\`variant\` text DEFAULT 'editorial-dots',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_timeline_order_idx\` ON \`_reusable_blocks_v_blocks_timeline\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_timeline_parent_id_idx\` ON \`_reusable_blocks_v_blocks_timeline\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_timeline_path_idx\` ON \`_reusable_blocks_v_blocks_timeline\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_prose\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`body\` text,
  	\`variant\` text DEFAULT 'editorial-with-dropcap',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_prose_order_idx\` ON \`_reusable_blocks_v_blocks_prose\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_prose_parent_id_idx\` ON \`_reusable_blocks_v_blocks_prose\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_prose_path_idx\` ON \`_reusable_blocks_v_blocks_prose\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_wave_divider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`flipped\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_wave_divider_order_idx\` ON \`_reusable_blocks_v_blocks_wave_divider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_wave_divider_parent_id_idx\` ON \`_reusable_blocks_v_blocks_wave_divider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_wave_divider_path_idx\` ON \`_reusable_blocks_v_blocks_wave_divider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_litter_card\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`show_sold\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_card_order_idx\` ON \`_reusable_blocks_v_blocks_litter_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_card_parent_id_idx\` ON \`_reusable_blocks_v_blocks_litter_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_card_path_idx\` ON \`_reusable_blocks_v_blocks_litter_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_card_litter_idx\` ON \`_reusable_blocks_v_blocks_litter_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_litter_header\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_header_order_idx\` ON \`_reusable_blocks_v_blocks_litter_header\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_header_parent_id_idx\` ON \`_reusable_blocks_v_blocks_litter_header\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_header_path_idx\` ON \`_reusable_blocks_v_blocks_litter_header\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_header_litter_idx\` ON \`_reusable_blocks_v_blocks_litter_header\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_pair_card_order_idx\` ON \`_reusable_blocks_v_blocks_litter_pair_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_pair_card_parent_id_idx\` ON \`_reusable_blocks_v_blocks_litter_pair_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_pair_card_path_idx\` ON \`_reusable_blocks_v_blocks_litter_pair_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_pair_card_litter_idx\` ON \`_reusable_blocks_v_blocks_litter_pair_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_litter_puppies\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`show_sold\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_puppies_order_idx\` ON \`_reusable_blocks_v_blocks_litter_puppies\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_puppies_parent_id_idx\` ON \`_reusable_blocks_v_blocks_litter_puppies\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_puppies_path_idx\` ON \`_reusable_blocks_v_blocks_litter_puppies\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_litter_puppies_litter_idx\` ON \`_reusable_blocks_v_blocks_litter_puppies\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_achievement_banner_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_achievement_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_achievement_banner_items_order_idx\` ON \`_reusable_blocks_v_blocks_achievement_banner_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_achievement_banner_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_achievement_banner_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_achievement_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT '🏆',
  	\`title\` text,
  	\`title_suffix\` text,
  	\`description\` text,
  	\`accent\` text DEFAULT 'amber',
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_achievement_banner_order_idx\` ON \`_reusable_blocks_v_blocks_achievement_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_achievement_banner_parent_id_idx\` ON \`_reusable_blocks_v_blocks_achievement_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_achievement_banner_path_idx\` ON \`_reusable_blocks_v_blocks_achievement_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_label\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_parent_idx\` ON \`_reusable_blocks_v\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_version_version_updated_at_idx\` ON \`_reusable_blocks_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_version_version_created_at_idx\` ON \`_reusable_blocks_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_version_version__status_idx\` ON \`_reusable_blocks_v\` (\`version__status\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_created_at_idx\` ON \`_reusable_blocks_v\` (\`created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_updated_at_idx\` ON \`_reusable_blocks_v\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_latest_idx\` ON \`_reusable_blocks_v\` (\`latest\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_autosave_idx\` ON \`_reusable_blocks_v\` (\`autosave\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`reusable_blocks_id\` integer REFERENCES reusable_blocks(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_reusable_blocks_id_idx\` ON \`payload_locked_documents_rels\` (\`reusable_blocks_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_reusable_ref\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_page_ref\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_reusable_ref\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_page_ref\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_litter_card\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_litter_header\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_litter_pair_card\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_litter_puppies\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_litter_card\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_litter_header\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_litter_pair_card\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_litter_puppies\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v\`;`);
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
  	\`dogs_id\` integer,
  	\`litters_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dogs_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`litters_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "dogs_id", "litters_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "dogs_id", "litters_id" FROM \`payload_locked_documents_rels\`;`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_dogs_id_idx\` ON \`payload_locked_documents_rels\` (\`dogs_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_litters_id_idx\` ON \`payload_locked_documents_rels\` (\`litters_id\`);`,
  );
}
