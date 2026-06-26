import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
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
  	\`heading\` text DEFAULT 'Начните с сайта. Вырастите во что угодно.',
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
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
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
  	\`heading\` text DEFAULT 'Начните с сайта. Вырастите во что угодно.',
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
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
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
  	\`heading\` text DEFAULT 'Начните с сайта. Вырастите во что угодно.',
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
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
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
  	\`heading\` text DEFAULT 'Начните с сайта. Вырастите во что угодно.',
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
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
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
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero\` (
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
    sql`INSERT INTO \`__new_pages_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`);
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero\` RENAME TO \`pages_blocks_hero\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_quote\` (
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
    sql`INSERT INTO \`__new_pages_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", NULL AS "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_quote\`;`);
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_quote\` RENAME TO \`pages_blocks_quote\`;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_order_idx\` ON \`pages_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_parent_id_idx\` ON \`pages_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_path_idx\` ON \`pages_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero\` (
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
    sql`INSERT INTO \`__new__pages_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`);
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero\` RENAME TO \`_pages_v_blocks_hero\`;`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_quote\` (
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
    sql`INSERT INTO \`__new__pages_v_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", NULL AS "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_quote\` RENAME TO \`_pages_v_blocks_quote\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_order_idx\` ON \`_pages_v_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_parent_id_idx\` ON \`_pages_v_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_path_idx\` ON \`_pages_v_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_hero\` (
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
    sql`INSERT INTO \`__new_reusable_blocks_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_hero\` RENAME TO \`reusable_blocks_blocks_hero\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_order_idx\` ON \`reusable_blocks_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_parent_id_idx\` ON \`reusable_blocks_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_path_idx\` ON \`reusable_blocks_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_quote\` (
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
    sql`INSERT INTO \`__new_reusable_blocks_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", NULL AS "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_quote\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_quote\` RENAME TO \`reusable_blocks_blocks_quote\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_order_idx\` ON \`reusable_blocks_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_parent_id_idx\` ON \`reusable_blocks_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_path_idx\` ON \`reusable_blocks_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_hero\` (
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
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_hero\` RENAME TO \`_reusable_blocks_v_blocks_hero\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_order_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_path_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_quote\` (
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
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", NULL AS "author_href", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_quote\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_quote\` RENAME TO \`_reusable_blocks_v_blocks_quote\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_order_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_parent_id_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_path_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_path\`);`,
  );
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
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_site_settings\`("id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "updated_at", "created_at") SELECT "id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "updated_at", "created_at" FROM \`site_settings\`;`,
  );
  await db.run(sql`DROP TABLE \`site_settings\`;`);
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`);
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
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
  await db.run(sql`DROP TABLE \`pages_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_block_showcase\`;`);
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
  await db.run(sql`DROP TABLE \`_pages_v_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_block_showcase\`;`);
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
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_block_showcase\`;`);
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
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_project_types_grid_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_project_types_grid\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_block_showcase_items\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_block_showcase\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Щенки {accent} с документами РКФ',
  	\`title_accent\` text DEFAULT 'ВЕО',
  	\`subtitle\` text DEFAULT 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
  	\`subtitle_short\` text DEFAULT 'Питомник ВЕО «Омская Дружина» · г. Омск',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_hero\`;`);
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_hero\` RENAME TO \`pages_blocks_hero\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_order_idx\` ON \`pages_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_parent_id_idx\` ON \`pages_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_hero_path_idx\` ON \`pages_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'О нас',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_quote\`;`);
  await db.run(sql`ALTER TABLE \`__new_pages_blocks_quote\` RENAME TO \`pages_blocks_quote\`;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_order_idx\` ON \`pages_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_parent_id_idx\` ON \`pages_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_path_idx\` ON \`pages_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Щенки {accent} с документами РКФ',
  	\`title_accent\` text DEFAULT 'ВЕО',
  	\`subtitle\` text DEFAULT 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
  	\`subtitle_short\` text DEFAULT 'Питомник ВЕО «Омская Дружина» · г. Омск',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_hero\`;`);
  await db.run(sql`ALTER TABLE \`__new__pages_v_blocks_hero\` RENAME TO \`_pages_v_blocks_hero\`;`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_order_idx\` ON \`_pages_v_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_parent_id_idx\` ON \`_pages_v_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_hero_path_idx\` ON \`_pages_v_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'О нас',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_quote\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_quote\` RENAME TO \`_pages_v_blocks_quote\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_order_idx\` ON \`_pages_v_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_parent_id_idx\` ON \`_pages_v_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_quote_path_idx\` ON \`_pages_v_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Щенки {accent} с документами РКФ',
  	\`title_accent\` text DEFAULT 'ВЕО',
  	\`subtitle\` text DEFAULT 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
  	\`subtitle_short\` text DEFAULT 'Питомник ВЕО «Омская Дружина» · г. Омск',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_hero\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_hero\` RENAME TO \`reusable_blocks_blocks_hero\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_order_idx\` ON \`reusable_blocks_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_parent_id_idx\` ON \`reusable_blocks_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_hero_path_idx\` ON \`reusable_blocks_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'О нас',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_quote\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_quote\` RENAME TO \`reusable_blocks_blocks_quote\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_order_idx\` ON \`reusable_blocks_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_parent_id_idx\` ON \`reusable_blocks_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_quote_path_idx\` ON \`reusable_blocks_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_hero\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text DEFAULT 'Щенки {accent} с документами РКФ',
  	\`title_accent\` text DEFAULT 'ВЕО',
  	\`subtitle\` text DEFAULT 'Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск',
  	\`subtitle_short\` text DEFAULT 'Питомник ВЕО «Омская Дружина» · г. Омск',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_hero\`("_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "title", "title_accent", "subtitle", "subtitle_short", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_hero\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_hero\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_hero\` RENAME TO \`_reusable_blocks_v_blocks_hero\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_order_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_parent_id_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_hero_path_idx\` ON \`_reusable_blocks_v_blocks_hero\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_quote\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'О нас',
  	\`body\` text,
  	\`author\` text,
  	\`role\` text,
  	\`variant\` text DEFAULT 'card-accent-left',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_quote\`("_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "heading", "body", "author", "role", "variant", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_quote\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_quote\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_quote\` RENAME TO \`_reusable_blocks_v_blocks_quote\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_order_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_parent_id_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_quote_path_idx\` ON \`_reusable_blocks_v_blocks_quote\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_site_settings\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`site_name\` text DEFAULT 'Питомник «Омская Дружина»' NOT NULL,
  	\`logo_id\` integer,
  	\`contacts_phone\` text,
  	\`contacts_email\` text,
  	\`contacts_address\` text,
  	\`contacts_hours\` text,
  	\`contacts_map_embed_url\` text,
  	\`theme_mode\` text DEFAULT 'light' NOT NULL,
  	\`theme_user_toggle\` integer DEFAULT false,
  	\`updated_at\` text,
  	\`created_at\` text,
  	FOREIGN KEY (\`logo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_site_settings\`("id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "updated_at", "created_at") SELECT "id", "site_name", "logo_id", "contacts_phone", "contacts_email", "contacts_address", "contacts_hours", "contacts_map_embed_url", "theme_mode", "theme_user_toggle", "updated_at", "created_at" FROM \`site_settings\`;`,
  );
  await db.run(sql`DROP TABLE \`site_settings\`;`);
  await db.run(sql`ALTER TABLE \`__new_site_settings\` RENAME TO \`site_settings\`;`);
  await db.run(sql`CREATE INDEX \`site_settings_logo_idx\` ON \`site_settings\` (\`logo_id\`);`);
}
