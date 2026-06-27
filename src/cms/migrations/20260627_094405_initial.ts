import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`users_sessions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`created_at\` text,
  	\`expires_at\` text NOT NULL,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`users\` (
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
  await db.run(sql`CREATE INDEX \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`users_created_at_idx\` ON \`users\` (\`created_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`users_email_idx\` ON \`users\` (\`email\`);`);
  await db.run(sql`CREATE TABLE \`media\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`alt\` text NOT NULL,
  	\`prefix\` text DEFAULT 'media',
  	\`caption\` text,
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
  	\`sizes_hero_filename\` text
  );
  `);
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
  await db.run(sql`CREATE TABLE \`pages_blocks_banner_slider_banners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_url\` text,
  	\`alt\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_banner_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_slider_banners_order_idx\` ON \`pages_blocks_banner_slider_banners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_slider_banners_parent_id_idx\` ON \`pages_blocks_banner_slider_banners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_banner_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_slider_order_idx\` ON \`pages_blocks_banner_slider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_slider_parent_id_idx\` ON \`pages_blocks_banner_slider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_banner_slider_path_idx\` ON \`pages_blocks_banner_slider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_split_badges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_badges_order_idx\` ON \`pages_blocks_hero_split_badges\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_badges_parent_id_idx\` ON \`pages_blocks_hero_split_badges\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_split_right_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`sub\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_right_steps_order_idx\` ON \`pages_blocks_hero_split_right_steps\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_right_steps_parent_id_idx\` ON \`pages_blocks_hero_split_right_steps\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_hero_split\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Начните с landing-сайта. Вырастите во что угодно.',
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_order_idx\` ON \`pages_blocks_hero_split\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_parent_id_idx\` ON \`pages_blocks_hero_split\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_split_path_idx\` ON \`pages_blocks_hero_split\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_order_idx\` ON \`pages_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_parent_id_idx\` ON \`pages_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_path_idx\` ON \`pages_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_stack_transparency_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_stack_transparency\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stack_transparency_items_order_idx\` ON \`pages_blocks_stack_transparency_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stack_transparency_items_parent_id_idx\` ON \`pages_blocks_stack_transparency_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_stack_transparency\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stack_transparency_order_idx\` ON \`pages_blocks_stack_transparency\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stack_transparency_parent_id_idx\` ON \`pages_blocks_stack_transparency\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_stack_transparency_path_idx\` ON \`pages_blocks_stack_transparency\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_comparison_table_left_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_left_items_order_idx\` ON \`pages_blocks_comparison_table_left_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_left_items_parent_id_idx\` ON \`pages_blocks_comparison_table_left_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_comparison_table_right_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_right_items_order_idx\` ON \`pages_blocks_comparison_table_right_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_right_items_parent_id_idx\` ON \`pages_blocks_comparison_table_right_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_comparison_table\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_order_idx\` ON \`pages_blocks_comparison_table\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_parent_id_idx\` ON \`pages_blocks_comparison_table\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_comparison_table_path_idx\` ON \`pages_blocks_comparison_table\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_feature_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`details\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_feature_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_items_order_idx\` ON \`pages_blocks_feature_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_items_parent_id_idx\` ON \`pages_blocks_feature_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_feature_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что уже решено за вас',
  	\`subtitle\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_order_idx\` ON \`pages_blocks_feature_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_parent_id_idx\` ON \`pages_blocks_feature_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_feature_grid_path_idx\` ON \`pages_blocks_feature_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_order_idx\` ON \`pages_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_parent_id_idx\` ON \`pages_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_items_screenshot_idx\` ON \`pages_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_built_with\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_order_idx\` ON \`pages_blocks_built_with\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_parent_id_idx\` ON \`pages_blocks_built_with\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_built_with_path_idx\` ON \`pages_blocks_built_with\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_order_idx\` ON \`pages_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_parent_id_idx\` ON \`pages_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_cta_banner_path_idx\` ON \`pages_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_quote_photo_urls\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`url\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_quote\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_photo_urls_order_idx\` ON \`pages_blocks_quote_photo_urls\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_photo_urls_parent_id_idx\` ON \`pages_blocks_quote_photo_urls\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'About us',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`author_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_order_idx\` ON \`pages_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_parent_id_idx\` ON \`pages_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_path_idx\` ON \`pages_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_timeline_entries\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`year\` text,
  	\`icon\` text,
  	\`body\` text,
  	\`hidden\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_timeline\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_entries_order_idx\` ON \`pages_blocks_timeline_entries\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_entries_parent_id_idx\` ON \`pages_blocks_timeline_entries\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_timeline\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_order_idx\` ON \`pages_blocks_timeline\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_parent_id_idx\` ON \`pages_blocks_timeline\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_timeline_path_idx\` ON \`pages_blocks_timeline\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_prose\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`body\` text,
  	\`variant\` text DEFAULT 'editorial-with-dropcap',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_prose_order_idx\` ON \`pages_blocks_prose\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_prose_parent_id_idx\` ON \`pages_blocks_prose\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_prose_path_idx\` ON \`pages_blocks_prose\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_wave_divider\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_wave_divider_order_idx\` ON \`pages_blocks_wave_divider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_wave_divider_parent_id_idx\` ON \`pages_blocks_wave_divider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_wave_divider_path_idx\` ON \`pages_blocks_wave_divider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_achievement_banner_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_achievement_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_achievement_banner_items_order_idx\` ON \`pages_blocks_achievement_banner_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_achievement_banner_items_parent_id_idx\` ON \`pages_blocks_achievement_banner_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_achievement_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT '🏆',
  	\`title\` text,
  	\`title_suffix\` text,
  	\`description\` text,
  	\`accent\` text DEFAULT 'amber',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_achievement_banner_order_idx\` ON \`pages_blocks_achievement_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_achievement_banner_parent_id_idx\` ON \`pages_blocks_achievement_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_achievement_banner_path_idx\` ON \`pages_blocks_achievement_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_certified_notice_criteria\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_criteria_order_idx\` ON \`pages_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_criteria_parent_id_idx\` ON \`pages_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_certified_notice\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_order_idx\` ON \`pages_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_parent_id_idx\` ON \`pages_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_certified_notice_path_idx\` ON \`pages_blocks_certified_notice\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_social_feed_sources\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages_blocks_social_feed\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_social_feed_sources_order_idx\` ON \`pages_blocks_social_feed_sources\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_social_feed_sources_parent_idx\` ON \`pages_blocks_social_feed_sources\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_social_feed\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_social_feed_order_idx\` ON \`pages_blocks_social_feed\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_social_feed_parent_id_idx\` ON \`pages_blocks_social_feed\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_social_feed_path_idx\` ON \`pages_blocks_social_feed\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_faq_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_faq_accordion_order_idx\` ON \`pages_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_faq_accordion_parent_id_idx\` ON \`pages_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_faq_accordion_path_idx\` ON \`pages_blocks_faq_accordion\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_project_types_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_project_types_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_project_types_grid_items_order_idx\` ON \`pages_blocks_project_types_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_project_types_grid_items_parent_id_idx\` ON \`pages_blocks_project_types_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_project_types_grid\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_project_types_grid_order_idx\` ON \`pages_blocks_project_types_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_project_types_grid_parent_id_idx\` ON \`pages_blocks_project_types_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_project_types_grid_path_idx\` ON \`pages_blocks_project_types_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_block_showcase_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`preview_id\` integer,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_block_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_block_showcase_items_order_idx\` ON \`pages_blocks_block_showcase_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_block_showcase_items_parent_id_idx\` ON \`pages_blocks_block_showcase_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_block_showcase_items_preview_idx\` ON \`pages_blocks_block_showcase_items\` (\`preview_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_block_showcase\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_block_showcase_order_idx\` ON \`pages_blocks_block_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_block_showcase_parent_id_idx\` ON \`pages_blocks_block_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_block_showcase_path_idx\` ON \`pages_blocks_block_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_reusable_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`ref_id\` integer,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  await db.run(sql`CREATE TABLE \`pages\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`seo_title\` text,
  	\`seo_description\` text,
  	\`seo_og_image_id\` integer,
  	\`seo_canonical\` text,
  	\`seo_noindex\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`pages_slug_idx\` ON \`pages\` (\`slug\`);`);
  await db.run(
    sql`CREATE INDEX \`pages_seo_seo_og_image_idx\` ON \`pages\` (\`seo_og_image_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`pages_updated_at_idx\` ON \`pages\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`pages_created_at_idx\` ON \`pages\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`pages__status_idx\` ON \`pages\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`pages_rels_faq_groups_id_idx\` ON \`pages_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner_slider_banners\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_url\` text,
  	\`alt\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_banner_slider\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_slider_banners_order_idx\` ON \`_pages_v_blocks_banner_slider_banners\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_slider_banners_parent_id_idx\` ON \`_pages_v_blocks_banner_slider_banners\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_banner_slider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_slider_order_idx\` ON \`_pages_v_blocks_banner_slider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_slider_parent_id_idx\` ON \`_pages_v_blocks_banner_slider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_banner_slider_path_idx\` ON \`_pages_v_blocks_banner_slider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_split_badges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_badges_order_idx\` ON \`_pages_v_blocks_hero_split_badges\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_badges_parent_id_idx\` ON \`_pages_v_blocks_hero_split_badges\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_split_right_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`sub\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_right_steps_order_idx\` ON \`_pages_v_blocks_hero_split_right_steps\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_right_steps_parent_id_idx\` ON \`_pages_v_blocks_hero_split_right_steps\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_hero_split\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Начните с landing-сайта. Вырастите во что угодно.',
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
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_order_idx\` ON \`_pages_v_blocks_hero_split\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_parent_id_idx\` ON \`_pages_v_blocks_hero_split\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_split_path_idx\` ON \`_pages_v_blocks_hero_split\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_order_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_parent_id_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_path_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stack_transparency_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_stack_transparency\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stack_transparency_items_order_idx\` ON \`_pages_v_blocks_stack_transparency_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stack_transparency_items_parent_id_idx\` ON \`_pages_v_blocks_stack_transparency_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_stack_transparency\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что под капотом',
  	\`subtitle\` text DEFAULT 'Решения зафиксированы — фокусируйтесь на продукте.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stack_transparency_order_idx\` ON \`_pages_v_blocks_stack_transparency\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stack_transparency_parent_id_idx\` ON \`_pages_v_blocks_stack_transparency\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_stack_transparency_path_idx\` ON \`_pages_v_blocks_stack_transparency\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_comparison_table_left_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_left_items_order_idx\` ON \`_pages_v_blocks_comparison_table_left_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_left_items_parent_id_idx\` ON \`_pages_v_blocks_comparison_table_left_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_comparison_table_right_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_right_items_order_idx\` ON \`_pages_v_blocks_comparison_table_right_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_right_items_parent_id_idx\` ON \`_pages_v_blocks_comparison_table_right_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_comparison_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Большинство сайтов заканчиваются тупиком',
  	\`left_label\` text DEFAULT 'Обычный путь',
  	\`right_label\` text DEFAULT 'С Web Holy Grail',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_order_idx\` ON \`_pages_v_blocks_comparison_table\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_parent_id_idx\` ON \`_pages_v_blocks_comparison_table\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_comparison_table_path_idx\` ON \`_pages_v_blocks_comparison_table\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_feature_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`details\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_feature_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_items_order_idx\` ON \`_pages_v_blocks_feature_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_items_parent_id_idx\` ON \`_pages_v_blocks_feature_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_feature_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что уже решено за вас',
  	\`subtitle\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_order_idx\` ON \`_pages_v_blocks_feature_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_parent_id_idx\` ON \`_pages_v_blocks_feature_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_feature_grid_path_idx\` ON \`_pages_v_blocks_feature_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_order_idx\` ON \`_pages_v_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_parent_id_idx\` ON \`_pages_v_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_items_screenshot_idx\` ON \`_pages_v_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_built_with\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Сайты, которые уже работают',
  	\`subtitle\` text DEFAULT 'Реальные production-инстансы на этом стеке.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_order_idx\` ON \`_pages_v_blocks_built_with\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_parent_id_idx\` ON \`_pages_v_blocks_built_with\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_built_with_path_idx\` ON \`_pages_v_blocks_built_with\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_order_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_parent_id_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_cta_banner_path_idx\` ON \`_pages_v_blocks_cta_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_quote_photo_urls\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`url\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_quote\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_photo_urls_order_idx\` ON \`_pages_v_blocks_quote_photo_urls\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_photo_urls_parent_id_idx\` ON \`_pages_v_blocks_quote_photo_urls\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'About us',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`author_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_order_idx\` ON \`_pages_v_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_parent_id_idx\` ON \`_pages_v_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_path_idx\` ON \`_pages_v_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_timeline_entries\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`year\` text,
  	\`icon\` text,
  	\`body\` text,
  	\`hidden\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_timeline\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_entries_order_idx\` ON \`_pages_v_blocks_timeline_entries\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_entries_parent_id_idx\` ON \`_pages_v_blocks_timeline_entries\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_timeline\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Наш путь',
  	\`visible_count\` numeric DEFAULT 3,
  	\`sort\` text DEFAULT 'year-desc',
  	\`variant\` text DEFAULT 'editorial-dots',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_order_idx\` ON \`_pages_v_blocks_timeline\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_parent_id_idx\` ON \`_pages_v_blocks_timeline\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_timeline_path_idx\` ON \`_pages_v_blocks_timeline\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_prose\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`body\` text,
  	\`variant\` text DEFAULT 'editorial-with-dropcap',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_prose_order_idx\` ON \`_pages_v_blocks_prose\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_prose_parent_id_idx\` ON \`_pages_v_blocks_prose\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_prose_path_idx\` ON \`_pages_v_blocks_prose\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_wave_divider\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`variant\` text DEFAULT 'wave',
  	\`flipped\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_wave_divider_order_idx\` ON \`_pages_v_blocks_wave_divider\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_wave_divider_parent_id_idx\` ON \`_pages_v_blocks_wave_divider\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_wave_divider_path_idx\` ON \`_pages_v_blocks_wave_divider\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_achievement_banner_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_achievement_banner\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_achievement_banner_items_order_idx\` ON \`_pages_v_blocks_achievement_banner_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_achievement_banner_items_parent_id_idx\` ON \`_pages_v_blocks_achievement_banner_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_achievement_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text DEFAULT '🏆',
  	\`title\` text,
  	\`title_suffix\` text,
  	\`description\` text,
  	\`accent\` text DEFAULT 'amber',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_achievement_banner_order_idx\` ON \`_pages_v_blocks_achievement_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_achievement_banner_parent_id_idx\` ON \`_pages_v_blocks_achievement_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_achievement_banner_path_idx\` ON \`_pages_v_blocks_achievement_banner\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_certified_notice_criteria\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_criteria_order_idx\` ON \`_pages_v_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_criteria_parent_id_idx\` ON \`_pages_v_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_certified_notice\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kicker\` text,
  	\`title\` text,
  	\`body\` text,
  	\`criteria_title\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_order_idx\` ON \`_pages_v_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_parent_id_idx\` ON \`_pages_v_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_certified_notice_path_idx\` ON \`_pages_v_blocks_certified_notice\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_social_feed_sources\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v_blocks_social_feed\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_social_feed_sources_order_idx\` ON \`_pages_v_blocks_social_feed_sources\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_social_feed_sources_parent_idx\` ON \`_pages_v_blocks_social_feed_sources\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_social_feed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`count\` numeric DEFAULT 30,
  	\`hide_latest\` numeric DEFAULT 2,
  	\`show_filters\` integer DEFAULT true,
  	\`week_top_n\` numeric DEFAULT 3,
  	\`month_top_n\` numeric DEFAULT 10,
  	\`hide_tag_regex\` text DEFAULT '#эксклюз',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_social_feed_order_idx\` ON \`_pages_v_blocks_social_feed\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_social_feed_parent_id_idx\` ON \`_pages_v_blocks_social_feed\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_social_feed_path_idx\` ON \`_pages_v_blocks_social_feed\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_faq_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`title_emoji\` text DEFAULT '🐾',
  	\`lead\` text,
  	\`show_chips\` integer DEFAULT true,
  	\`cta_text\` text,
  	\`cta_link_label\` text,
  	\`cta_link_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_faq_accordion_order_idx\` ON \`_pages_v_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_faq_accordion_parent_id_idx\` ON \`_pages_v_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_faq_accordion_path_idx\` ON \`_pages_v_blocks_faq_accordion\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_project_types_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_project_types_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_project_types_grid_items_order_idx\` ON \`_pages_v_blocks_project_types_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_project_types_grid_items_parent_id_idx\` ON \`_pages_v_blocks_project_types_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_project_types_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Одна архитектура. Несколько сценариев роста.',
  	\`heading_accent\` text,
  	\`subtitle\` text DEFAULT 'Выберите стартовую точку под ваш проект. Архитектура остаётся той же — меняется только стартовая конфигурация.',
  	\`caption\` text DEFAULT 'Тип проекта — это старт, не ограничение. Добавляйте возможности по мере роста.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_project_types_grid_order_idx\` ON \`_pages_v_blocks_project_types_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_project_types_grid_parent_id_idx\` ON \`_pages_v_blocks_project_types_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_project_types_grid_path_idx\` ON \`_pages_v_blocks_project_types_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_block_showcase_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`preview_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v_blocks_block_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_block_showcase_items_order_idx\` ON \`_pages_v_blocks_block_showcase_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_block_showcase_items_parent_id_idx\` ON \`_pages_v_blocks_block_showcase_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_block_showcase_items_preview_idx\` ON \`_pages_v_blocks_block_showcase_items\` (\`preview_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_block_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Современный UI из коробки',
  	\`subtitle\` text DEFAULT 'Готовые блоки на shadcn/ui + Tailwind + дизайн-токены.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_block_showcase_order_idx\` ON \`_pages_v_blocks_block_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_block_showcase_parent_id_idx\` ON \`_pages_v_blocks_block_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_block_showcase_path_idx\` ON \`_pages_v_blocks_block_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_reusable_ref\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`ref_id\` integer,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  await db.run(sql`CREATE TABLE \`_pages_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_seo_title\` text,
  	\`version_seo_description\` text,
  	\`version_seo_og_image_id\` integer,
  	\`version_seo_canonical\` text,
  	\`version_seo_noindex\` integer,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_seo_og_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`_pages_v_parent_idx\` ON \`_pages_v\` (\`parent_id\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_slug_idx\` ON \`_pages_v\` (\`version_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_seo_version_seo_og_image_idx\` ON \`_pages_v\` (\`version_seo_og_image_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_updated_at_idx\` ON \`_pages_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version_created_at_idx\` ON \`_pages_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_version_version__status_idx\` ON \`_pages_v\` (\`version__status\`);`,
  );
  await db.run(sql`CREATE INDEX \`_pages_v_created_at_idx\` ON \`_pages_v\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`_pages_v_updated_at_idx\` ON \`_pages_v\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`_pages_v_latest_idx\` ON \`_pages_v\` (\`latest\`);`);
  await db.run(sql`CREATE INDEX \`_pages_v_autosave_idx\` ON \`_pages_v\` (\`autosave\`);`);
  await db.run(sql`CREATE TABLE \`_pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_faq_groups_id_idx\` ON \`_pages_v_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`form_submissions\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`form_type\` text NOT NULL,
  	\`data\` text NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`source\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE INDEX \`form_submissions_updated_at_idx\` ON \`form_submissions\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`form_submissions_created_at_idx\` ON \`form_submissions\` (\`created_at\`);`,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_hero_split_badges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_badges_order_idx\` ON \`reusable_blocks_blocks_hero_split_badges\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_badges_parent_id_idx\` ON \`reusable_blocks_blocks_hero_split_badges\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_hero_split_right_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`sub\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_right_steps_order_idx\` ON \`reusable_blocks_blocks_hero_split_right_steps\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_right_steps_parent_id_idx\` ON \`reusable_blocks_blocks_hero_split_right_steps\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_hero_split\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Начните с landing-сайта. Вырастите во что угодно.',
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_order_idx\` ON \`reusable_blocks_blocks_hero_split\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_parent_id_idx\` ON \`reusable_blocks_blocks_hero_split\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_split_path_idx\` ON \`reusable_blocks_blocks_hero_split\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_order_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_parent_id_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_path_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_stack_transparency_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`href\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_stack_transparency\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_stack_transparency_items_order_idx\` ON \`reusable_blocks_blocks_stack_transparency_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_stack_transparency_items_parent_id_idx\` ON \`reusable_blocks_blocks_stack_transparency_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_stack_transparency\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_stack_transparency_order_idx\` ON \`reusable_blocks_blocks_stack_transparency\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_stack_transparency_parent_id_idx\` ON \`reusable_blocks_blocks_stack_transparency\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_stack_transparency_path_idx\` ON \`reusable_blocks_blocks_stack_transparency\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_comparison_table_left_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_left_items_order_idx\` ON \`reusable_blocks_blocks_comparison_table_left_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_left_items_parent_id_idx\` ON \`reusable_blocks_blocks_comparison_table_left_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_comparison_table_right_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_right_items_order_idx\` ON \`reusable_blocks_blocks_comparison_table_right_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_right_items_parent_id_idx\` ON \`reusable_blocks_blocks_comparison_table_right_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_comparison_table\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_order_idx\` ON \`reusable_blocks_blocks_comparison_table\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_parent_id_idx\` ON \`reusable_blocks_blocks_comparison_table\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_comparison_table_path_idx\` ON \`reusable_blocks_blocks_comparison_table\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_feature_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`details\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_feature_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_items_order_idx\` ON \`reusable_blocks_blocks_feature_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_items_parent_id_idx\` ON \`reusable_blocks_blocks_feature_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_feature_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что уже решено за вас',
  	\`subtitle\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_order_idx\` ON \`reusable_blocks_blocks_feature_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_parent_id_idx\` ON \`reusable_blocks_blocks_feature_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_feature_grid_path_idx\` ON \`reusable_blocks_blocks_feature_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_order_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_parent_id_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_items_screenshot_idx\` ON \`reusable_blocks_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_built_with\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_order_idx\` ON \`reusable_blocks_blocks_built_with\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_parent_id_idx\` ON \`reusable_blocks_blocks_built_with\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_built_with_path_idx\` ON \`reusable_blocks_blocks_built_with\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_order_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_parent_id_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_cta_banner_path_idx\` ON \`reusable_blocks_blocks_cta_banner\` (\`_path\`);`,
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
  	\`heading\` text DEFAULT 'About us',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`author_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`variant\` text DEFAULT 'wave',
  	\`flipped\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_certified_notice_criteria\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_criteria_order_idx\` ON \`reusable_blocks_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_criteria_parent_id_idx\` ON \`reusable_blocks_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_certified_notice\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_order_idx\` ON \`reusable_blocks_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_parent_id_idx\` ON \`reusable_blocks_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_certified_notice_path_idx\` ON \`reusable_blocks_blocks_certified_notice\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_social_feed_sources\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` text NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`reusable_blocks_blocks_social_feed\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_social_feed_sources_order_idx\` ON \`reusable_blocks_blocks_social_feed_sources\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_social_feed_sources_parent_idx\` ON \`reusable_blocks_blocks_social_feed_sources\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_social_feed\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_social_feed_order_idx\` ON \`reusable_blocks_blocks_social_feed\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_social_feed_parent_id_idx\` ON \`reusable_blocks_blocks_social_feed\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_social_feed_path_idx\` ON \`reusable_blocks_blocks_social_feed\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_faq_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_faq_accordion_order_idx\` ON \`reusable_blocks_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_faq_accordion_parent_id_idx\` ON \`reusable_blocks_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_faq_accordion_path_idx\` ON \`reusable_blocks_blocks_faq_accordion\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_project_types_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available',
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_project_types_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_project_types_grid_items_order_idx\` ON \`reusable_blocks_blocks_project_types_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_project_types_grid_items_parent_id_idx\` ON \`reusable_blocks_blocks_project_types_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_project_types_grid\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_project_types_grid_order_idx\` ON \`reusable_blocks_blocks_project_types_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_project_types_grid_parent_id_idx\` ON \`reusable_blocks_blocks_project_types_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_project_types_grid_path_idx\` ON \`reusable_blocks_blocks_project_types_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_block_showcase_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`preview_id\` integer,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks_blocks_block_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_block_showcase_items_order_idx\` ON \`reusable_blocks_blocks_block_showcase_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_block_showcase_items_parent_id_idx\` ON \`reusable_blocks_blocks_block_showcase_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_block_showcase_items_preview_idx\` ON \`reusable_blocks_blocks_block_showcase_items\` (\`preview_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_block_showcase\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_block_showcase_order_idx\` ON \`reusable_blocks_blocks_block_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_block_showcase_parent_id_idx\` ON \`reusable_blocks_blocks_block_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_block_showcase_path_idx\` ON \`reusable_blocks_blocks_block_showcase\` (\`_path\`);`,
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
  await db.run(sql`CREATE TABLE \`reusable_blocks_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_order_idx\` ON \`reusable_blocks_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_parent_idx\` ON \`reusable_blocks_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_path_idx\` ON \`reusable_blocks_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_faq_groups_id_idx\` ON \`reusable_blocks_rels\` (\`faq_groups_id\`);`,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`title\` text DEFAULT 'Lorem ipsum {accent} dolor sit amet',
  	\`title_accent\` text DEFAULT 'consectetur',
  	\`subtitle\` text DEFAULT 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  	\`subtitle_short\` text DEFAULT 'Lorem ipsum dolor sit amet.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_hero_split_badges\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_badges_order_idx\` ON \`_reusable_blocks_v_blocks_hero_split_badges\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_badges_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero_split_badges\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_hero_split_right_steps\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`sub\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_hero_split\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_right_steps_order_idx\` ON \`_reusable_blocks_v_blocks_hero_split_right_steps\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_right_steps_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero_split_right_steps\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_hero_split\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Начните с landing-сайта. Вырастите во что угодно.',
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
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_order_idx\` ON \`_reusable_blocks_v_blocks_hero_split\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero_split\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_split_path_idx\` ON \`_reusable_blocks_v_blocks_hero_split\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_order_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_parent_id_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_path_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_stack_transparency_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`href\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_stack_transparency\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_stack_transparency_items_order_idx\` ON \`_reusable_blocks_v_blocks_stack_transparency_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_stack_transparency_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_stack_transparency_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_stack_transparency\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что под капотом',
  	\`subtitle\` text DEFAULT 'Решения зафиксированы — фокусируйтесь на продукте.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_stack_transparency_order_idx\` ON \`_reusable_blocks_v_blocks_stack_transparency\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_stack_transparency_parent_id_idx\` ON \`_reusable_blocks_v_blocks_stack_transparency\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_stack_transparency_path_idx\` ON \`_reusable_blocks_v_blocks_stack_transparency\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_comparison_table_left_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_left_items_order_idx\` ON \`_reusable_blocks_v_blocks_comparison_table_left_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_left_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_comparison_table_left_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_comparison_table_right_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_comparison_table\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_right_items_order_idx\` ON \`_reusable_blocks_v_blocks_comparison_table_right_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_right_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_comparison_table_right_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_comparison_table\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Большинство сайтов заканчиваются тупиком',
  	\`left_label\` text DEFAULT 'Обычный путь',
  	\`right_label\` text DEFAULT 'С Web Holy Grail',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_order_idx\` ON \`_reusable_blocks_v_blocks_comparison_table\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_parent_id_idx\` ON \`_reusable_blocks_v_blocks_comparison_table\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_comparison_table_path_idx\` ON \`_reusable_blocks_v_blocks_comparison_table\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_feature_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`title\` text,
  	\`subtitle\` text,
  	\`description\` text,
  	\`details\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_feature_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_items_order_idx\` ON \`_reusable_blocks_v_blocks_feature_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_feature_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_feature_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Что уже решено за вас',
  	\`subtitle\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_order_idx\` ON \`_reusable_blocks_v_blocks_feature_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_parent_id_idx\` ON \`_reusable_blocks_v_blocks_feature_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_feature_grid_path_idx\` ON \`_reusable_blocks_v_blocks_feature_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_built_with_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text,
  	\`url\` text,
  	\`niche\` text,
  	\`screenshot_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`screenshot_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_built_with\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_order_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_items_screenshot_idx\` ON \`_reusable_blocks_v_blocks_built_with_items\` (\`screenshot_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_built_with\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Сайты, которые уже работают',
  	\`subtitle\` text DEFAULT 'Реальные production-инстансы на этом стеке.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_order_idx\` ON \`_reusable_blocks_v_blocks_built_with\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_parent_id_idx\` ON \`_reusable_blocks_v_blocks_built_with\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_built_with_path_idx\` ON \`_reusable_blocks_v_blocks_built_with\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_cta_banner\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Готовы начать?',
  	\`subtitle\` text DEFAULT 'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
  	\`cta_primary_label\` text DEFAULT 'Использовать шаблон',
  	\`cta_primary_href\` text DEFAULT '#',
  	\`cta_secondary_label\` text DEFAULT 'Документация',
  	\`cta_secondary_href\` text DEFAULT '#',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_order_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_parent_id_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_cta_banner_path_idx\` ON \`_reusable_blocks_v_blocks_cta_banner\` (\`_path\`);`,
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
  	\`heading\` text DEFAULT 'About us',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`author_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`variant\` text DEFAULT 'wave',
  	\`flipped\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
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
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_certified_notice_criteria\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_certified_notice\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_criteria_order_idx\` ON \`_reusable_blocks_v_blocks_certified_notice_criteria\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_criteria_parent_id_idx\` ON \`_reusable_blocks_v_blocks_certified_notice_criteria\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_certified_notice\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kicker\` text,
  	\`title\` text,
  	\`body\` text,
  	\`criteria_title\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_order_idx\` ON \`_reusable_blocks_v_blocks_certified_notice\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_parent_id_idx\` ON \`_reusable_blocks_v_blocks_certified_notice\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_certified_notice_path_idx\` ON \`_reusable_blocks_v_blocks_certified_notice\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_social_feed_sources\` (
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`value\` text,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_social_feed\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_social_feed_sources_order_idx\` ON \`_reusable_blocks_v_blocks_social_feed_sources\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_social_feed_sources_parent_idx\` ON \`_reusable_blocks_v_blocks_social_feed_sources\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_social_feed\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`count\` numeric DEFAULT 30,
  	\`hide_latest\` numeric DEFAULT 2,
  	\`show_filters\` integer DEFAULT true,
  	\`week_top_n\` numeric DEFAULT 3,
  	\`month_top_n\` numeric DEFAULT 10,
  	\`hide_tag_regex\` text DEFAULT '#эксклюз',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_social_feed_order_idx\` ON \`_reusable_blocks_v_blocks_social_feed\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_social_feed_parent_id_idx\` ON \`_reusable_blocks_v_blocks_social_feed\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_social_feed_path_idx\` ON \`_reusable_blocks_v_blocks_social_feed\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_faq_accordion\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`title_emoji\` text DEFAULT '🐾',
  	\`lead\` text,
  	\`show_chips\` integer DEFAULT true,
  	\`cta_text\` text,
  	\`cta_link_label\` text,
  	\`cta_link_href\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_faq_accordion_order_idx\` ON \`_reusable_blocks_v_blocks_faq_accordion\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_faq_accordion_parent_id_idx\` ON \`_reusable_blocks_v_blocks_faq_accordion\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_faq_accordion_path_idx\` ON \`_reusable_blocks_v_blocks_faq_accordion\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_project_types_grid_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`icon\` text,
  	\`label\` text,
  	\`description\` text,
  	\`status\` text DEFAULT 'available',
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_project_types_grid\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_project_types_grid_items_order_idx\` ON \`_reusable_blocks_v_blocks_project_types_grid_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_project_types_grid_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_project_types_grid_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_project_types_grid\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Одна архитектура. Несколько сценариев роста.',
  	\`heading_accent\` text,
  	\`subtitle\` text DEFAULT 'Выберите стартовую точку под ваш проект. Архитектура остаётся той же — меняется только стартовая конфигурация.',
  	\`caption\` text DEFAULT 'Тип проекта — это старт, не ограничение. Добавляйте возможности по мере роста.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_project_types_grid_order_idx\` ON \`_reusable_blocks_v_blocks_project_types_grid\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_project_types_grid_parent_id_idx\` ON \`_reusable_blocks_v_blocks_project_types_grid\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_project_types_grid_path_idx\` ON \`_reusable_blocks_v_blocks_project_types_grid\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_block_showcase_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`label\` text,
  	\`preview_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`preview_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v_blocks_block_showcase\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_block_showcase_items_order_idx\` ON \`_reusable_blocks_v_blocks_block_showcase_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_block_showcase_items_parent_id_idx\` ON \`_reusable_blocks_v_blocks_block_showcase_items\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_block_showcase_items_preview_idx\` ON \`_reusable_blocks_v_blocks_block_showcase_items\` (\`preview_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_block_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Современный UI из коробки',
  	\`subtitle\` text DEFAULT 'Готовые блоки на shadcn/ui + Tailwind + дизайн-токены.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_block_showcase_order_idx\` ON \`_reusable_blocks_v_blocks_block_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_block_showcase_parent_id_idx\` ON \`_reusable_blocks_v_blocks_block_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_block_showcase_path_idx\` ON \`_reusable_blocks_v_blocks_block_showcase\` (\`_path\`);`,
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
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_order_idx\` ON \`_reusable_blocks_v_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_parent_idx\` ON \`_reusable_blocks_v_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_path_idx\` ON \`_reusable_blocks_v_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_faq_groups_id_idx\` ON \`_reusable_blocks_v_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`posts_media\` (
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
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`posts_media_order_idx\` ON \`posts_media\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`posts_media_parent_id_idx\` ON \`posts_media\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`posts_mentions\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`start\` numeric NOT NULL,
  	\`end\` numeric NOT NULL,
  	\`type\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`display\` text NOT NULL,
  	\`data\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`posts_mentions_order_idx\` ON \`posts_mentions\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`posts_mentions_parent_id_idx\` ON \`posts_mentions\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`posts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`source\` text NOT NULL,
  	\`source_id\` text NOT NULL,
  	\`source_owner_id\` text,
  	\`source_url\` text NOT NULL,
  	\`date\` numeric NOT NULL,
  	\`date_iso\` text,
  	\`text\` text,
  	\`author_type\` text,
  	\`author_name\` text,
  	\`author_photo\` text,
  	\`author_url\` text,
  	\`metrics_likes\` numeric DEFAULT 0,
  	\`metrics_comments\` numeric DEFAULT 0,
  	\`metrics_reposts\` numeric DEFAULT 0,
  	\`metrics_views\` numeric DEFAULT 0,
  	\`preview_title\` text,
  	\`synced_at\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(sql`CREATE INDEX \`posts_source_id_idx\` ON \`posts\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`posts_date_idx\` ON \`posts\` (\`date\`);`);
  await db.run(sql`CREATE INDEX \`posts_updated_at_idx\` ON \`posts\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`posts_created_at_idx\` ON \`posts\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`comments\` (
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
  	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`comments_source_id_idx\` ON \`comments\` (\`source_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_post_idx\` ON \`comments\` (\`post_id\`);`);
  await db.run(sql`CREATE INDEX \`comments_date_idx\` ON \`comments\` (\`date\`);`);
  await db.run(sql`CREATE INDEX \`comments_updated_at_idx\` ON \`comments\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`comments_created_at_idx\` ON \`comments\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`faq_groups_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`open_by_default\` integer DEFAULT false,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`faq_groups_items_order_idx\` ON \`faq_groups_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`faq_groups_items_parent_id_idx\` ON \`faq_groups_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`faq_groups\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` numeric DEFAULT 100,
  	\`emoji\` text DEFAULT '🏡',
  	\`title\` text,
  	\`slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `);
  await db.run(sql`CREATE INDEX \`faq_groups_updated_at_idx\` ON \`faq_groups\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`faq_groups_created_at_idx\` ON \`faq_groups\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`faq_groups__status_idx\` ON \`faq_groups\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`_faq_groups_v_version_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`question\` text,
  	\`answer\` text,
  	\`open_by_default\` integer DEFAULT false,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_faq_groups_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_items_order_idx\` ON \`_faq_groups_v_version_items\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_items_parent_id_idx\` ON \`_faq_groups_v_version_items\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_faq_groups_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_order\` numeric DEFAULT 100,
  	\`version_emoji\` text DEFAULT '🏡',
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_parent_idx\` ON \`_faq_groups_v\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_version_updated_at_idx\` ON \`_faq_groups_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_version_created_at_idx\` ON \`_faq_groups_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_version_version__status_idx\` ON \`_faq_groups_v\` (\`version__status\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_created_at_idx\` ON \`_faq_groups_v\` (\`created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_faq_groups_v_updated_at_idx\` ON \`_faq_groups_v\` (\`updated_at\`);`,
  );
  await db.run(sql`CREATE INDEX \`_faq_groups_v_latest_idx\` ON \`_faq_groups_v\` (\`latest\`);`);
  await db.run(sql`CREATE TABLE \`payload_kv\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text NOT NULL,
  	\`data\` text NOT NULL
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`);
  await db.run(sql`CREATE TABLE \`payload_locked_documents\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`global_slug\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	\`media_id\` integer,
  	\`pages_id\` integer,
  	\`form_submissions_id\` integer,
  	\`reusable_blocks_id\` integer,
  	\`posts_id\` integer,
  	\`comments_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`posts_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`comments_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
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
  await db.run(sql`CREATE TABLE \`payload_preferences\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`key\` text,
  	\`value\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE INDEX \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`payload_preferences_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`payload_migrations\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`batch\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE INDEX \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`,
  );
  await db.run(sql`CREATE TABLE \`site_settings_main_nav\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`href\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`external\` integer,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`site_settings_main_nav_order_idx\` ON \`site_settings_main_nav\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`site_settings_main_nav_parent_id_idx\` ON \`site_settings_main_nav\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`site_settings_footer_nav\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`href\` text NOT NULL,
  	\`label\` text NOT NULL,
  	\`external\` integer,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`site_settings_footer_nav_order_idx\` ON \`site_settings_footer_nav\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`site_settings_footer_nav_parent_id_idx\` ON \`site_settings_footer_nav\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`site_settings_social\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`platform\` text NOT NULL,
  	\`url\` text NOT NULL,
  	\`label\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`site_settings\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`site_settings_social_order_idx\` ON \`site_settings_social\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`site_settings_social_parent_id_idx\` ON \`site_settings_social\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`site_settings\` (
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
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`users_sessions\`;`);
  await db.run(sql`DROP TABLE \`users\`;`);
  await db.run(sql`DROP TABLE \`media\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_hero_split_badges\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_hero_split_right_steps\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_hero_split\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_install_snippet\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_stack_transparency_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_stack_transparency\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_comparison_table_left_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_comparison_table_right_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_comparison_table\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_feature_grid_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_feature_grid\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_built_with_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_built_with\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_cta_banner\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_social_feed_sources\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_social_feed\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_block_showcase\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_reusable_ref\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_page_ref\`;`);
  await db.run(sql`DROP TABLE \`pages\`;`);
  await db.run(sql`DROP TABLE \`pages_rels\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_split_badges\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_split_right_steps\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero_split\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_install_snippet\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stack_transparency_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_stack_transparency\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_comparison_table_left_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_comparison_table_right_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_comparison_table\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_feature_grid_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_feature_grid\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_built_with_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_built_with\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_cta_banner\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_social_feed_sources\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_social_feed\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_block_showcase\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_reusable_ref\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_page_ref\`;`);
  await db.run(sql`DROP TABLE \`_pages_v\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`);
  await db.run(sql`DROP TABLE \`form_submissions\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero_split_badges\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero_split_right_steps\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero_split\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_install_snippet\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_stack_transparency_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_stack_transparency\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_comparison_table_left_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_comparison_table_right_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_comparison_table\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_feature_grid_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_feature_grid\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_built_with_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_built_with\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_cta_banner\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_social_feed_sources\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_social_feed\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_block_showcase\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_rels\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_banner_slider_banners\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_banner_slider\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero_split_badges\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero_split_right_steps\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero_split\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_install_snippet\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_stack_transparency_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_stack_transparency\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_comparison_table_left_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_comparison_table_right_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_comparison_table\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_feature_grid_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_feature_grid\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_built_with_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_built_with\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_cta_banner\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_quote_photo_urls\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_quote\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_timeline_entries\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_timeline\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_prose\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_wave_divider\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_certified_notice_criteria\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_certified_notice\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_social_feed_sources\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_social_feed\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_faq_accordion\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_block_showcase\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_rels\`;`);
  await db.run(sql`DROP TABLE \`posts_media\`;`);
  await db.run(sql`DROP TABLE \`posts_mentions\`;`);
  await db.run(sql`DROP TABLE \`posts\`;`);
  await db.run(sql`DROP TABLE \`comments\`;`);
  await db.run(sql`DROP TABLE \`faq_groups_items\`;`);
  await db.run(sql`DROP TABLE \`faq_groups\`;`);
  await db.run(sql`DROP TABLE \`_faq_groups_v_version_items\`;`);
  await db.run(sql`DROP TABLE \`_faq_groups_v\`;`);
  await db.run(sql`DROP TABLE \`payload_kv\`;`);
  await db.run(sql`DROP TABLE \`payload_locked_documents\`;`);
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(sql`DROP TABLE \`payload_preferences\`;`);
  await db.run(sql`DROP TABLE \`payload_preferences_rels\`;`);
  await db.run(sql`DROP TABLE \`payload_migrations\`;`);
  await db.run(sql`DROP TABLE \`site_settings_main_nav\`;`);
  await db.run(sql`DROP TABLE \`site_settings_footer_nav\`;`);
  await db.run(sql`DROP TABLE \`site_settings_social\`;`);
  await db.run(sql`DROP TABLE \`site_settings\`;`);
}
