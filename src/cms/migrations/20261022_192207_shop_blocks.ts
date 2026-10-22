import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_shop_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`cart_href\` text DEFAULT '/cart',
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_shop_showcase_order_idx\` ON \`pages_blocks_shop_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_shop_showcase_parent_id_idx\` ON \`pages_blocks_shop_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_shop_showcase_path_idx\` ON \`pages_blocks_shop_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_shop_cart\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Корзина',
  	\`empty_text\` text DEFAULT 'В корзине пока пусто.',
  	\`policy_href\` text DEFAULT '/privacy',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_shop_cart_order_idx\` ON \`pages_blocks_shop_cart\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_shop_cart_parent_id_idx\` ON \`pages_blocks_shop_cart\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_shop_cart_path_idx\` ON \`pages_blocks_shop_cart\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_shop_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`cart_href\` text DEFAULT '/cart',
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_shop_showcase_order_idx\` ON \`_pages_v_blocks_shop_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_shop_showcase_parent_id_idx\` ON \`_pages_v_blocks_shop_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_shop_showcase_path_idx\` ON \`_pages_v_blocks_shop_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_shop_cart\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Корзина',
  	\`empty_text\` text DEFAULT 'В корзине пока пусто.',
  	\`policy_href\` text DEFAULT '/privacy',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_shop_cart_order_idx\` ON \`_pages_v_blocks_shop_cart\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_shop_cart_parent_id_idx\` ON \`_pages_v_blocks_shop_cart\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_shop_cart_path_idx\` ON \`_pages_v_blocks_shop_cart\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_shop_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`cart_href\` text DEFAULT '/cart',
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_shop_showcase_order_idx\` ON \`reusable_blocks_blocks_shop_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_shop_showcase_parent_id_idx\` ON \`reusable_blocks_blocks_shop_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_shop_showcase_path_idx\` ON \`reusable_blocks_blocks_shop_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_shop_cart\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Корзина',
  	\`empty_text\` text DEFAULT 'В корзине пока пусто.',
  	\`policy_href\` text DEFAULT '/privacy',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_shop_cart_order_idx\` ON \`reusable_blocks_blocks_shop_cart\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_shop_cart_parent_id_idx\` ON \`reusable_blocks_blocks_shop_cart\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_shop_cart_path_idx\` ON \`reusable_blocks_blocks_shop_cart\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_shop_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`cart_href\` text DEFAULT '/cart',
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_shop_showcase_order_idx\` ON \`_reusable_blocks_v_blocks_shop_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_shop_showcase_parent_id_idx\` ON \`_reusable_blocks_v_blocks_shop_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_shop_showcase_path_idx\` ON \`_reusable_blocks_v_blocks_shop_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_shop_cart\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Корзина',
  	\`empty_text\` text DEFAULT 'В корзине пока пусто.',
  	\`policy_href\` text DEFAULT '/privacy',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_shop_cart_order_idx\` ON \`_reusable_blocks_v_blocks_shop_cart\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_shop_cart_parent_id_idx\` ON \`_reusable_blocks_v_blocks_shop_cart\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_shop_cart_path_idx\` ON \`_reusable_blocks_v_blocks_shop_cart\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_shop_showcase\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text,
  	\`description\` text,
  	\`cart_href\` text DEFAULT '/cart',
  	\`tile_layout\` text,
  	\`tile_layout_md\` text,
  	\`tile_layout_sm\` text,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_shop_showcase_order_idx\` ON \`specialists_blocks_shop_showcase\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_shop_showcase_parent_id_idx\` ON \`specialists_blocks_shop_showcase\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_shop_showcase_path_idx\` ON \`specialists_blocks_shop_showcase\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`specialists_blocks_shop_cart\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`heading\` text DEFAULT 'Корзина',
  	\`empty_text\` text DEFAULT 'В корзине пока пусто.',
  	\`policy_href\` text DEFAULT '/privacy',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_shop_cart_order_idx\` ON \`specialists_blocks_shop_cart\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_shop_cart_parent_id_idx\` ON \`specialists_blocks_shop_cart\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_blocks_shop_cart_path_idx\` ON \`specialists_blocks_shop_cart\` (\`_path\`);`,
  );
  await db.run(sql`ALTER TABLE \`pages_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`);
  await db.run(sql`CREATE INDEX \`pages_rels_offers_id_idx\` ON \`pages_rels\` (\`offers_id\`);`);
  await db.run(sql`ALTER TABLE \`_pages_v_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_offers_id_idx\` ON \`_pages_v_rels\` (\`offers_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_offers_id_idx\` ON \`reusable_blocks_rels\` (\`offers_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_offers_id_idx\` ON \`_reusable_blocks_v_rels\` (\`offers_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_offers_id_idx\` ON \`specialists_rels\` (\`offers_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`payment_note\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_shop_showcase\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_shop_cart\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_shop_showcase\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_shop_cart\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_shop_showcase\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_shop_cart\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_shop_showcase\`;`);
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_shop_cart\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_shop_showcase\`;`);
  await db.run(sql`DROP TABLE \`specialists_blocks_shop_cart\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_rels\`("id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id") SELECT "id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id" FROM \`pages_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_rels\`;`);
  await db.run(sql`ALTER TABLE \`__new_pages_rels\` RENAME TO \`pages_rels\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`pages_rels_order_idx\` ON \`pages_rels\` (\`order\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_parent_idx\` ON \`pages_rels\` (\`parent_id\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_path_idx\` ON \`pages_rels\` (\`path\`);`);
  await db.run(sql`CREATE INDEX \`pages_rels_media_id_idx\` ON \`pages_rels\` (\`media_id\`);`);
  await db.run(
    sql`CREATE INDEX \`pages_rels_articles_id_idx\` ON \`pages_rels\` (\`articles_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`pages_rels_threads_id_idx\` ON \`pages_rels\` (\`threads_id\`);`);
  await db.run(
    sql`CREATE INDEX \`pages_rels_faq_groups_id_idx\` ON \`pages_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_rels\`("id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id") SELECT "id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id" FROM \`_pages_v_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_rels\`;`);
  await db.run(sql`ALTER TABLE \`__new__pages_v_rels\` RENAME TO \`_pages_v_rels\`;`);
  await db.run(sql`CREATE INDEX \`_pages_v_rels_order_idx\` ON \`_pages_v_rels\` (\`order\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_parent_idx\` ON \`_pages_v_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`_pages_v_rels_path_idx\` ON \`_pages_v_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_media_id_idx\` ON \`_pages_v_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_articles_id_idx\` ON \`_pages_v_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_threads_id_idx\` ON \`_pages_v_rels\` (\`threads_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_rels_faq_groups_id_idx\` ON \`_pages_v_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_rels\`("id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id") SELECT "id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id" FROM \`reusable_blocks_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_rels\`;`);
  await db.run(sql`ALTER TABLE \`__new_reusable_blocks_rels\` RENAME TO \`reusable_blocks_rels\`;`);
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
    sql`CREATE INDEX \`reusable_blocks_rels_media_id_idx\` ON \`reusable_blocks_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_articles_id_idx\` ON \`reusable_blocks_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_threads_id_idx\` ON \`reusable_blocks_rels\` (\`threads_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_rels_faq_groups_id_idx\` ON \`reusable_blocks_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_rels\`("id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id") SELECT "id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id" FROM \`_reusable_blocks_v_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_rels\` RENAME TO \`_reusable_blocks_v_rels\`;`,
  );
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
    sql`CREATE INDEX \`_reusable_blocks_v_rels_media_id_idx\` ON \`_reusable_blocks_v_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_articles_id_idx\` ON \`_reusable_blocks_v_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_threads_id_idx\` ON \`_reusable_blocks_v_rels\` (\`threads_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_rels_faq_groups_id_idx\` ON \`_reusable_blocks_v_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_specialists_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`faq_groups_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_specialists_rels\`("id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id") SELECT "id", "order", "parent_id", "path", "media_id", "articles_id", "threads_id", "faq_groups_id" FROM \`specialists_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`specialists_rels\`;`);
  await db.run(sql`ALTER TABLE \`__new_specialists_rels\` RENAME TO \`specialists_rels\`;`);
  await db.run(
    sql`CREATE INDEX \`specialists_rels_order_idx\` ON \`specialists_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_parent_idx\` ON \`specialists_rels\` (\`parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`specialists_rels_path_idx\` ON \`specialists_rels\` (\`path\`);`);
  await db.run(
    sql`CREATE INDEX \`specialists_rels_media_id_idx\` ON \`specialists_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_articles_id_idx\` ON \`specialists_rels\` (\`articles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_threads_id_idx\` ON \`specialists_rels\` (\`threads_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`specialists_rels_faq_groups_id_idx\` ON \`specialists_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`payment_note\`;`);
}
