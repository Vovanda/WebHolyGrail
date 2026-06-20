import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_achievement_banner\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_achievement_banner_items\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_achievement_banner\`;`);
}
