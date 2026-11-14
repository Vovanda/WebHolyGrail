// @safe-bluegreen - только новые таблицы, колонки и индексы магазина
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
  await db.run(sql`CREATE TABLE \`orders_lines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`offer_id\` integer,
  	\`title\` text NOT NULL,
  	\`quantity\` numeric NOT NULL,
  	\`price_micros\` numeric NOT NULL,
  	\`sum_micros\` numeric,
  	\`access_id\` integer,
  	FOREIGN KEY (\`offer_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`access_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`orders_lines_order_idx\` ON \`orders_lines\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`orders_lines_parent_id_idx\` ON \`orders_lines\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`orders_lines_offer_idx\` ON \`orders_lines\` (\`offer_id\`);`);
  await db.run(sql`CREATE INDEX \`orders_lines_access_idx\` ON \`orders_lines\` (\`access_id\`);`);
  await db.run(sql`CREATE TABLE \`orders\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`status\` text DEFAULT 'new' NOT NULL,
  	\`total_micros\` numeric NOT NULL,
  	\`buyer_name\` text,
  	\`buyer_phone\` text,
  	\`buyer_email\` text,
  	\`buyer_comment\` text,
  	\`manager_note\` text,
  	\`secret_hash\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(sql`CREATE INDEX \`orders_secret_hash_idx\` ON \`orders\` (\`secret_hash\`);`);
  await db.run(sql`CREATE INDEX \`orders_updated_at_idx\` ON \`orders\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`orders_created_at_idx\` ON \`orders\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`invoices_lines\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`offer_id\` integer,
  	\`title\` text NOT NULL,
  	\`quantity\` numeric NOT NULL,
  	\`price_micros\` numeric NOT NULL,
  	\`sum_micros\` numeric,
  	\`access_id\` integer,
  	FOREIGN KEY (\`offer_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`access_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`invoices_lines_order_idx\` ON \`invoices_lines\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`invoices_lines_parent_id_idx\` ON \`invoices_lines\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_lines_offer_idx\` ON \`invoices_lines\` (\`offer_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`invoices_lines_access_idx\` ON \`invoices_lines\` (\`access_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`invoices_codes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`line\` numeric,
  	\`code_id\` text,
  	\`code\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`invoices_codes_order_idx\` ON \`invoices_codes\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`invoices_codes_parent_id_idx\` ON \`invoices_codes\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`invoices\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`kind\` text DEFAULT 'invoice' NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`order_id\` integer NOT NULL,
  	\`refund_of_id\` integer,
  	\`due_at\` text,
  	\`total_micros\` numeric NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`refund_of_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`invoices_order_idx\` ON \`invoices\` (\`order_id\`);`);
  await db.run(sql`CREATE INDEX \`invoices_refund_of_idx\` ON \`invoices\` (\`refund_of_id\`);`);
  await db.run(sql`CREATE INDEX \`invoices_updated_at_idx\` ON \`invoices\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`invoices_created_at_idx\` ON \`invoices\` (\`created_at\`);`);
  await db.run(sql`CREATE TABLE \`offers\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`price_micros\` numeric,
  	\`stock\` numeric,
  	\`image_id\` integer,
  	\`summary\` text,
  	\`access_id\` integer,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`access_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`offers_image_idx\` ON \`offers\` (\`image_id\`);`);
  await db.run(sql`CREATE INDEX \`offers_access_idx\` ON \`offers\` (\`access_id\`);`);
  await db.run(sql`CREATE INDEX \`offers_updated_at_idx\` ON \`offers\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`offers_created_at_idx\` ON \`offers\` (\`created_at\`);`);
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
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`orders_id\` integer REFERENCES orders(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`invoices_id\` integer REFERENCES invoices(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`offers_id\` integer REFERENCES offers(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_orders_id_idx\` ON \`payload_locked_documents_rels\` (\`orders_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_invoices_id_idx\` ON \`payload_locked_documents_rels\` (\`invoices_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_offers_id_idx\` ON \`payload_locked_documents_rels\` (\`offers_id\`);`,
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
  await db.run(sql`DROP TABLE \`orders_lines\`;`);
  await db.run(sql`DROP TABLE \`orders\`;`);
  await db.run(sql`DROP TABLE \`invoices_lines\`;`);
  await db.run(sql`DROP TABLE \`invoices_codes\`;`);
  await db.run(sql`DROP TABLE \`invoices\`;`);
  await db.run(sql`DROP TABLE \`offers\`;`);
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
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`pages_id\` integer,
  	\`reusable_blocks_id\` integer,
  	\`faq_groups_id\` integer,
  	\`form_submissions_id\` integer,
  	\`articles_id\` integer,
  	\`threads_id\` integer,
  	\`tags_id\` integer,
  	\`authors_id\` integer,
  	\`media_id\` integer,
  	\`playlists_id\` integer,
  	\`media_accesses_id\` integer,
  	\`media_access_rights_id\` integer,
  	\`media_access_codes_id\` integer,
  	\`media_access_links_id\` integer,
  	\`cities_id\` integer,
  	\`specialists_id\` integer,
  	\`social_posts_id\` integer,
  	\`comments_id\` integer,
  	\`feature_toggles_id\` integer,
  	\`users_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`reusable_blocks_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`faq_groups_id\`) REFERENCES \`faq_groups\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`articles_id\`) REFERENCES \`articles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`threads_id\`) REFERENCES \`threads\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`tags_id\`) REFERENCES \`tags\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`authors_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_accesses_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_access_rights_id\`) REFERENCES \`media_access_rights\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_access_codes_id\`) REFERENCES \`media_access_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_access_links_id\`) REFERENCES \`media_access_links\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`cities_id\`) REFERENCES \`cities\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`specialists_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`social_posts_id\`) REFERENCES \`social_posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`comments_id\`) REFERENCES \`comments\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`feature_toggles_id\`) REFERENCES \`feature_toggles\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "pages_id", "reusable_blocks_id", "faq_groups_id", "form_submissions_id", "articles_id", "threads_id", "tags_id", "authors_id", "media_id", "playlists_id", "media_accesses_id", "media_access_rights_id", "media_access_codes_id", "media_access_links_id", "cities_id", "specialists_id", "social_posts_id", "comments_id", "feature_toggles_id", "users_id") SELECT "id", "order", "parent_id", "path", "pages_id", "reusable_blocks_id", "faq_groups_id", "form_submissions_id", "articles_id", "threads_id", "tags_id", "authors_id", "media_id", "playlists_id", "media_accesses_id", "media_access_rights_id", "media_access_codes_id", "media_access_links_id", "cities_id", "specialists_id", "social_posts_id", "comments_id", "feature_toggles_id", "users_id" FROM \`payload_locked_documents_rels\`;`,
  );
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`,
  );
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
    sql`CREATE INDEX \`payload_locked_documents_rels_pages_id_idx\` ON \`payload_locked_documents_rels\` (\`pages_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_reusable_blocks_id_idx\` ON \`payload_locked_documents_rels\` (\`reusable_blocks_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_faq_groups_id_idx\` ON \`payload_locked_documents_rels\` (\`faq_groups_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_form_submissions_id_idx\` ON \`payload_locked_documents_rels\` (\`form_submissions_id\`);`,
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
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_playlists_id_idx\` ON \`payload_locked_documents_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_accesses_id_idx\` ON \`payload_locked_documents_rels\` (\`media_accesses_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_rights_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_rights_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_codes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_links_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_links_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_cities_id_idx\` ON \`payload_locked_documents_rels\` (\`cities_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_specialists_id_idx\` ON \`payload_locked_documents_rels\` (\`specialists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_social_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`social_posts_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_comments_id_idx\` ON \`payload_locked_documents_rels\` (\`comments_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_feature_toggles_id_idx\` ON \`payload_locked_documents_rels\` (\`feature_toggles_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`payment_note\`;`);
}
