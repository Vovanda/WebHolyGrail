// @safe-bluegreen — только новые таблицы каталога и блоков, ничего не удаляется
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_request_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Оставить заявку',
  	\`description\` text,
  	\`request_type\` text DEFAULT 'general',
  	\`specialist_id\` integer,
  	\`collapsible\` integer DEFAULT false,
  	\`toggle_label\` text DEFAULT 'Оставить заявку',
  	\`submit_label\` text DEFAULT 'Отправить',
  	\`success_text\` text DEFAULT 'Заявка отправлена. Свяжемся с вами в ближайшее время.',
  	\`ask_city\` integer DEFAULT true,
  	\`message_label\` text DEFAULT 'Сообщение',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`specialist_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_request_form_order_idx\` ON \`pages_blocks_request_form\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_request_form_parent_id_idx\` ON \`pages_blocks_request_form\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_request_form_path_idx\` ON \`pages_blocks_request_form\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_request_form_specialist_idx\` ON \`pages_blocks_request_form\` (\`specialist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_order_idx\` ON \`pages_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_parent_id_idx\` ON \`pages_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_specialist_directory_path_idx\` ON \`pages_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_request_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Оставить заявку',
  	\`description\` text,
  	\`request_type\` text DEFAULT 'general',
  	\`specialist_id\` integer,
  	\`collapsible\` integer DEFAULT false,
  	\`toggle_label\` text DEFAULT 'Оставить заявку',
  	\`submit_label\` text DEFAULT 'Отправить',
  	\`success_text\` text DEFAULT 'Заявка отправлена. Свяжемся с вами в ближайшее время.',
  	\`ask_city\` integer DEFAULT true,
  	\`message_label\` text DEFAULT 'Сообщение',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`specialist_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_request_form_order_idx\` ON \`_pages_v_blocks_request_form\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_request_form_parent_id_idx\` ON \`_pages_v_blocks_request_form\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_request_form_path_idx\` ON \`_pages_v_blocks_request_form\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_request_form_specialist_idx\` ON \`_pages_v_blocks_request_form\` (\`specialist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_order_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_parent_id_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_specialist_directory_path_idx\` ON \`_pages_v_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_request_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Оставить заявку',
  	\`description\` text,
  	\`request_type\` text DEFAULT 'general',
  	\`specialist_id\` integer,
  	\`collapsible\` integer DEFAULT false,
  	\`toggle_label\` text DEFAULT 'Оставить заявку',
  	\`submit_label\` text DEFAULT 'Отправить',
  	\`success_text\` text DEFAULT 'Заявка отправлена. Свяжемся с вами в ближайшее время.',
  	\`ask_city\` integer DEFAULT true,
  	\`message_label\` text DEFAULT 'Сообщение',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`specialist_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_request_form_order_idx\` ON \`reusable_blocks_blocks_request_form\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_request_form_parent_id_idx\` ON \`reusable_blocks_blocks_request_form\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_request_form_path_idx\` ON \`reusable_blocks_blocks_request_form\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_request_form_specialist_idx\` ON \`reusable_blocks_blocks_request_form\` (\`specialist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_order_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_parent_id_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_specialist_directory_path_idx\` ON \`reusable_blocks_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_request_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Оставить заявку',
  	\`description\` text,
  	\`request_type\` text DEFAULT 'general',
  	\`specialist_id\` integer,
  	\`collapsible\` integer DEFAULT false,
  	\`toggle_label\` text DEFAULT 'Оставить заявку',
  	\`submit_label\` text DEFAULT 'Отправить',
  	\`success_text\` text DEFAULT 'Заявка отправлена. Свяжемся с вами в ближайшее время.',
  	\`ask_city\` integer DEFAULT true,
  	\`message_label\` text DEFAULT 'Сообщение',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`specialist_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_request_form_order_idx\` ON \`_reusable_blocks_v_blocks_request_form\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_request_form_parent_id_idx\` ON \`_reusable_blocks_v_blocks_request_form\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_request_form_path_idx\` ON \`_reusable_blocks_v_blocks_request_form\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_request_form_specialist_idx\` ON \`_reusable_blocks_v_blocks_request_form\` (\`specialist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_order_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_parent_id_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_specialist_directory_path_idx\` ON \`_reusable_blocks_v_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`cities\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text NOT NULL,
  	\`slug\` text,
  	\`order\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`cities_slug_idx\` ON \`cities\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`cities_updated_at_idx\` ON \`cities\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`cities_created_at_idx\` ON \`cities\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`specialists_disciplines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_disciplines_order_idx\` ON \`specialists_disciplines\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_disciplines_parent_id_idx\` ON \`specialists_disciplines\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_credentials\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`note\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_credentials_order_idx\` ON \`specialists_credentials\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_credentials_parent_id_idx\` ON \`specialists_credentials\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_facts\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_facts_order_idx\` ON \`specialists_facts\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_facts_parent_id_idx\` ON \`specialists_facts\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_locations\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`address\` text,
  	\`note\` text,
  	\`map_url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_locations_order_idx\` ON \`specialists_locations\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_locations_parent_id_idx\` ON \`specialists_locations\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_banner_slider_banners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_url\` text NOT NULL,
  	\`alt\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_banner_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_banner_slider_banners_order_idx\` ON \`specialists_blocks_banner_slider_banners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_banner_slider_banners_parent_id_idx\` ON \`specialists_blocks_banner_slider_banners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_banner_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_banner_slider_order_idx\` ON \`specialists_blocks_banner_slider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_banner_slider_parent_id_idx\` ON \`specialists_blocks_banner_slider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_banner_slider_path_idx\` ON \`specialists_blocks_banner_slider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet' NOT NULL,
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_order_idx\` ON \`specialists_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_parent_id_idx\` ON \`specialists_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_path_idx\` ON \`specialists_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_hero_split_badges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_badges_order_idx\` ON \`specialists_blocks_hero_split_badges\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_badges_parent_id_idx\` ON \`specialists_blocks_hero_split_badges\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_hero_split_right_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text NOT NULL,
  	\`sub\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_right_steps_order_idx\` ON \`specialists_blocks_hero_split_right_steps\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_right_steps_parent_id_idx\` ON \`specialists_blocks_hero_split_right_steps\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_hero_split\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Начните с landing-сайта. Вырастите во что угодно.' NOT NULL,
  	\`heading_accent\` text,
  	\`subtitle\` text DEFAULT 'Web Holy Grail — self-hosted сайт с CMS и архитектурой, которая не заставит вас начинать заново через год.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Смотреть демо',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`right_title\` text,
  	\`right_caption\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_order_idx\` ON \`specialists_blocks_hero_split\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_parent_id_idx\` ON \`specialists_blocks_hero_split\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_split_path_idx\` ON \`specialists_blocks_hero_split\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_hero_cinematic_corners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`position\` text DEFAULT 'top-left' NOT NULL,
  	\`title\` text NOT NULL,
  	\`subtitle\` text,
  	\`emphasis\` text DEFAULT 'medium',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_hero_cinematic\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_corners_order_idx\` ON \`specialists_blocks_hero_cinematic_corners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_hero_cinematic_corners_parent_id_idx\` ON \`specialists_blocks_hero_cinematic_corners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_hero_cinematic\` (
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
  await db.run(sql`CREATE TABLE \`specialists_blocks_request_form\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Оставить заявку' NOT NULL,
  	\`description\` text,
  	\`request_type\` text DEFAULT 'general' NOT NULL,
  	\`specialist_id\` integer,
  	\`collapsible\` integer DEFAULT false,
  	\`toggle_label\` text DEFAULT 'Оставить заявку',
  	\`submit_label\` text DEFAULT 'Отправить',
  	\`success_text\` text DEFAULT 'Заявка отправлена. Свяжемся с вами в ближайшее время.',
  	\`ask_city\` integer DEFAULT true,
  	\`message_label\` text DEFAULT 'Сообщение',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`specialist_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_request_form_order_idx\` ON \`specialists_blocks_request_form\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_request_form_parent_id_idx\` ON \`specialists_blocks_request_form\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_request_form_path_idx\` ON \`specialists_blocks_request_form\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_request_form_specialist_idx\` ON \`specialists_blocks_request_form\` (\`specialist_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_specialist_directory\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Специалисты',
  	\`description\` text,
  	\`only_accepting\` integer DEFAULT true,
  	\`order\` text DEFAULT 'random',
  	\`limit\` numeric DEFAULT 12,
  	\`show_cities\` integer DEFAULT true,
  	\`empty_text\` text DEFAULT 'Скоро здесь появятся специалисты.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_order_idx\` ON \`specialists_blocks_specialist_directory\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_parent_id_idx\` ON \`specialists_blocks_specialist_directory\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_specialist_directory_path_idx\` ON \`specialists_blocks_specialist_directory\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone' NOT NULL,
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_install_snippet_order_idx\` ON \`specialists_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_install_snippet_parent_id_idx\` ON \`specialists_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_install_snippet_path_idx\` ON \`specialists_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_stack_transparency_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_stack_transparency\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_stack_transparency_items_order_idx\` ON \`specialists_blocks_stack_transparency_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_stack_transparency_items_parent_id_idx\` ON \`specialists_blocks_stack_transparency_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_stack_transparency\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что под капотом',
  	\`subtitle\` text DEFAULT 'Решения зафиксированы — фокусируйтесь на продукте.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_stack_transparency_order_idx\` ON \`specialists_blocks_stack_transparency\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_stack_transparency_parent_id_idx\` ON \`specialists_blocks_stack_transparency\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_stack_transparency_path_idx\` ON \`specialists_blocks_stack_transparency\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_comparison_table_left_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_left_items_order_idx\` ON \`specialists_blocks_comparison_table_left_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_left_items_parent_id_idx\` ON \`specialists_blocks_comparison_table_left_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_comparison_table_right_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_right_items_order_idx\` ON \`specialists_blocks_comparison_table_right_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_right_items_parent_id_idx\` ON \`specialists_blocks_comparison_table_right_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_comparison_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Большинство сайтов заканчиваются тупиком',
  	\`left_label\` text DEFAULT 'Обычный путь',
  	\`right_label\` text DEFAULT 'С Web Holy Grail',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_order_idx\` ON \`specialists_blocks_comparison_table\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_parent_id_idx\` ON \`specialists_blocks_comparison_table\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_comparison_table_path_idx\` ON \`specialists_blocks_comparison_table\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_feature_grid_items_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_feature_grid_items\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_items_images_order_idx\` ON \`specialists_blocks_feature_grid_items_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_items_images_parent_id_idx\` ON \`specialists_blocks_feature_grid_items_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_items_images_image_idx\` ON \`specialists_blocks_feature_grid_items_images\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_feature_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text NOT NULL,
  	\`title\` text NOT NULL,
  	\`subtitle\` text,
  	\`description\` text,
  	\`details\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_feature_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_items_order_idx\` ON \`specialists_blocks_feature_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_items_parent_id_idx\` ON \`specialists_blocks_feature_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_feature_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что уже решено за вас',
  	\`subtitle\` text,
  	\`layout\` text DEFAULT 'grid',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_order_idx\` ON \`specialists_blocks_feature_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_parent_id_idx\` ON \`specialists_blocks_feature_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_feature_grid_path_idx\` ON \`specialists_blocks_feature_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`site_name\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_order_idx\` ON \`specialists_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_parent_id_idx\` ON \`specialists_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_items_screenshot_idx\` ON \`specialists_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_built_with\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Сайты, которые уже работают',
  	\`subtitle\` text DEFAULT 'Реальные production-инстансы на этом стеке.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_order_idx\` ON \`specialists_blocks_built_with\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_parent_id_idx\` ON \`specialists_blocks_built_with\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_built_with_path_idx\` ON \`specialists_blocks_built_with\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?' NOT NULL,
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон' NOT NULL,
  	\`cta_primary_href\` text DEFAULT '#' NOT NULL,
  	\`cta_secondary_label\` text,
  	\`cta_secondary_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_cta_banner_order_idx\` ON \`specialists_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_cta_banner_parent_id_idx\` ON \`specialists_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_cta_banner_path_idx\` ON \`specialists_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_quote_photo_urls\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`url\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_quote\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_quote_photo_urls_order_idx\` ON \`specialists_blocks_quote_photo_urls\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_quote_photo_urls_parent_id_idx\` ON \`specialists_blocks_quote_photo_urls\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'About us',
  	\`body\` text NOT NULL,
  	\`author\` text NOT NULL,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`author_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_quote_order_idx\` ON \`specialists_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_quote_parent_id_idx\` ON \`specialists_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_quote_path_idx\` ON \`specialists_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_timeline_entries\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text NOT NULL,
  	\`icon\` text,
  	\`body\` text NOT NULL,
  	\`hidden\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_timeline\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_timeline_entries_order_idx\` ON \`specialists_blocks_timeline_entries\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_timeline_entries_parent_id_idx\` ON \`specialists_blocks_timeline_entries\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_timeline\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Наш путь',
  	\`visible_count\` numeric DEFAULT 3,
  	\`sort\` text DEFAULT 'year-desc',
  	\`variant\` text DEFAULT 'editorial-dots',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_timeline_order_idx\` ON \`specialists_blocks_timeline\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_timeline_parent_id_idx\` ON \`specialists_blocks_timeline\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_timeline_path_idx\` ON \`specialists_blocks_timeline\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_prose\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`body\` text NOT NULL,
  	\`variant\` text DEFAULT 'editorial-with-dropcap',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_prose_order_idx\` ON \`specialists_blocks_prose\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_prose_parent_id_idx\` ON \`specialists_blocks_prose\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_prose_path_idx\` ON \`specialists_blocks_prose\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_rich_text\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`content\` text NOT NULL,
  	\`width\` text DEFAULT 'content',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_rich_text_order_idx\` ON \`specialists_blocks_rich_text\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_rich_text_parent_id_idx\` ON \`specialists_blocks_rich_text\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_rich_text_path_idx\` ON \`specialists_blocks_rich_text\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_wave_divider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`variant\` text DEFAULT 'wave',
  	\`flipped\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_wave_divider_order_idx\` ON \`specialists_blocks_wave_divider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_wave_divider_parent_id_idx\` ON \`specialists_blocks_wave_divider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_wave_divider_path_idx\` ON \`specialists_blocks_wave_divider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_achievement_banner_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_achievement_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_achievement_banner_items_order_idx\` ON \`specialists_blocks_achievement_banner_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_achievement_banner_items_parent_id_idx\` ON \`specialists_blocks_achievement_banner_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_achievement_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT '🏆' NOT NULL,
  	\`title\` text NOT NULL,
  	\`title_suffix\` text,
  	\`description\` text,
  	\`accent\` text DEFAULT 'amber',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_achievement_banner_order_idx\` ON \`specialists_blocks_achievement_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_achievement_banner_parent_id_idx\` ON \`specialists_blocks_achievement_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_achievement_banner_path_idx\` ON \`specialists_blocks_achievement_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_certified_notice_criteria\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_certified_notice_criteria_order_idx\` ON \`specialists_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_certified_notice_criteria_parent_id_idx\` ON \`specialists_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_certified_notice\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`kicker\` text,
  	\`title\` text,
  	\`body\` text,
  	\`criteria_title\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_certified_notice_order_idx\` ON \`specialists_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_certified_notice_parent_id_idx\` ON \`specialists_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_certified_notice_path_idx\` ON \`specialists_blocks_certified_notice\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_social_feed_sources\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`specialists_blocks_social_feed\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_social_feed_sources_order_idx\` ON \`specialists_blocks_social_feed_sources\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_social_feed_sources_parent_idx\` ON \`specialists_blocks_social_feed_sources\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_social_feed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`count\` numeric DEFAULT 30,
  	\`hide_latest\` numeric DEFAULT 2,
  	\`show_filters\` integer DEFAULT true,
  	\`week_top_n\` numeric DEFAULT 3,
  	\`month_top_n\` numeric DEFAULT 10,
  	\`hide_tag_regex\` text DEFAULT '#эксклюз',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_social_feed_order_idx\` ON \`specialists_blocks_social_feed\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_social_feed_parent_id_idx\` ON \`specialists_blocks_social_feed\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_social_feed_path_idx\` ON \`specialists_blocks_social_feed\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_articles_section\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`description\` text,
  	\`source\` text DEFAULT 'latest' NOT NULL,
  	\`tag_id\` integer,
  	\`thread_id\` integer,
  	\`limit\` numeric DEFAULT 6,
  	\`sort\` text DEFAULT 'newest',
  	\`layout\` text DEFAULT 'divided',
  	\`cta_label\` text,
  	\`cta_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`tag_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`thread_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_articles_section_order_idx\` ON \`specialists_blocks_articles_section\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_articles_section_parent_id_idx\` ON \`specialists_blocks_articles_section\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_articles_section_path_idx\` ON \`specialists_blocks_articles_section\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_articles_section_tag_idx\` ON \`specialists_blocks_articles_section\` (\`tag_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_articles_section_thread_idx\` ON \`specialists_blocks_articles_section\` (\`thread_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_faq_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`title_emoji\` text DEFAULT '🐾',
  	\`lead\` text,
  	\`show_chips\` integer DEFAULT true,
  	\`cta_text\` text,
  	\`cta_link_label\` text,
  	\`cta_link_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_faq_accordion_order_idx\` ON \`specialists_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_faq_accordion_parent_id_idx\` ON \`specialists_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_faq_accordion_path_idx\` ON \`specialists_blocks_faq_accordion\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_project_types_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`description\` text,
  	\`status\` text DEFAULT 'available',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_project_types_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_project_types_grid_items_order_idx\` ON \`specialists_blocks_project_types_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_project_types_grid_items_parent_id_idx\` ON \`specialists_blocks_project_types_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_project_types_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Одна архитектура. Несколько сценариев роста.',
  	\`heading_accent\` text,
  	\`subtitle\` text DEFAULT 'Выберите стартовую точку под ваш проект. Архитектура остаётся той же — меняется только стартовая конфигурация.',
  	\`caption\` text DEFAULT 'Тип проекта — это старт, не ограничение. Добавляйте возможности по мере роста.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_project_types_grid_order_idx\` ON \`specialists_blocks_project_types_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_project_types_grid_parent_id_idx\` ON \`specialists_blocks_project_types_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_project_types_grid_path_idx\` ON \`specialists_blocks_project_types_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_block_showcase_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text NOT NULL,
  	\`preview_id\` integer,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists_blocks_block_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_block_showcase_items_order_idx\` ON \`specialists_blocks_block_showcase_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_block_showcase_items_parent_id_idx\` ON \`specialists_blocks_block_showcase_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_block_showcase_items_preview_idx\` ON \`specialists_blocks_block_showcase_items\` (\`preview_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_block_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Современный UI из коробки',
  	\`subtitle\` text DEFAULT 'Готовые блоки на shadcn/ui + Tailwind + дизайн-токены.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_block_showcase_order_idx\` ON \`specialists_blocks_block_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_block_showcase_parent_id_idx\` ON \`specialists_blocks_block_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_block_showcase_path_idx\` ON \`specialists_blocks_block_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_reusable_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ref_id\` integer NOT NULL,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`ref_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_reusable_ref_order_idx\` ON \`specialists_blocks_reusable_ref\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_reusable_ref_parent_id_idx\` ON \`specialists_blocks_reusable_ref\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_reusable_ref_path_idx\` ON \`specialists_blocks_reusable_ref\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_reusable_ref_ref_idx\` ON \`specialists_blocks_reusable_ref\` (\`ref_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_page_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ref_id\` integer NOT NULL,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`ref_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_page_ref_order_idx\` ON \`specialists_blocks_page_ref\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_page_ref_parent_id_idx\` ON \`specialists_blocks_page_ref\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_page_ref_path_idx\` ON \`specialists_blocks_page_ref\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_page_ref_ref_idx\` ON \`specialists_blocks_page_ref\` (\`ref_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`full_name\` text NOT NULL,
  	\`nickname\` text,
  	\`photo_id\` integer,
  	\`headline\` text,
  	\`city_id\` integer,
  	\`bio\` text,
  	\`accepting_clients\` integer DEFAULT true,
  	\`contacts_phone\` text,
  	\`contacts_email\` text,
  	\`contacts_telegram\` text,
  	\`contacts_whatsapp\` text,
  	\`contacts_vk\` text,
  	\`contacts_site\` text,
  	\`slug\` text,
  	\`owner_id\` integer,
  	\`rating\` numeric,
  	\`rating_public\` integer DEFAULT false,
  	\`boost\` numeric DEFAULT 0,
  	\`requests_count\` numeric DEFAULT 0,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`city_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`owner_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`specialists_photo_idx\` ON \`specialists\` (\`photo_id\`);`);
  await db.run(sql`CREATE INDEX \`specialists_city_idx\` ON \`specialists\` (\`city_id\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`specialists_slug_idx\` ON \`specialists\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`specialists_owner_idx\` ON \`specialists\` (\`owner_id\`);`);
  await db.run(
    sql`CREATE INDEX \`specialists_updated_at_idx\` ON \`specialists\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_created_at_idx\` ON \`specialists\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`articles_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_rels_order_idx\` ON \`specialists_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_parent_idx\` ON \`specialists_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`specialists_rels_path_idx\` ON \`specialists_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`specialists_rels_articles_id_idx\` ON \`specialists_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_faq_groups_id_idx\` ON \`specialists_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`cities_id\` integer REFERENCES cities(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`specialists_id\` integer REFERENCES specialists(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_specialists_id_idx\` ON \`payload_locked_documents_rels\` (\`specialists_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_request_form\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_specialist_directory\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_request_form\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_specialist_directory\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_request_form\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_specialist_directory\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_request_form\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_specialist_directory\`;`);
  await db.run(sql`DROP TABLE \`cities\`;`);
  await db.run(sql`DROP TABLE \`specialists_disciplines\`;`);
  await db.run(sql`DROP TABLE \`specialists_credentials\`;`);
  await db.run(sql`DROP TABLE \`specialists_facts\`;`);
  await db.run(sql`DROP TABLE \`specialists_locations\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_hero_split_badges\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_hero_split_right_steps\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_hero_split\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_hero_cinematic_corners\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_hero_cinematic\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_request_form\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_specialist_directory\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_install_snippet\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_stack_transparency_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_stack_transparency\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_comparison_table_left_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_comparison_table_right_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_comparison_table\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_feature_grid_items_images\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_feature_grid_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_feature_grid\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_built_with_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_built_with\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_cta_banner\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_rich_text\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_social_feed_sources\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_social_feed\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_articles_section\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_block_showcase\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_reusable_ref\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_page_ref\`;`);
  await db.run(sql`DROP TABLE \`specialists\`;`);
  await db.run(sql`DROP TABLE \`specialists_rels\`;`);
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
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id", "articles_id", "threads_id", "tags_id", "authors_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "reusable_blocks_id", "social_posts_id", "comments_id", "faq_groups_id", "articles_id", "threads_id", "tags_id", "authors_id" FROM \`payload_locked_documents_rels\`;`,
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
}
