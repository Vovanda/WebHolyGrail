import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_litter_header\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_header_order_idx\` ON \`pages_blocks_litter_header\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_header_parent_id_idx\` ON \`pages_blocks_litter_header\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_header_path_idx\` ON \`pages_blocks_litter_header\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_header_litter_idx\` ON \`pages_blocks_litter_header\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_litter_pair_card\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_pair_card_order_idx\` ON \`pages_blocks_litter_pair_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_pair_card_parent_id_idx\` ON \`pages_blocks_litter_pair_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_pair_card_path_idx\` ON \`pages_blocks_litter_pair_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_pair_card_litter_idx\` ON \`pages_blocks_litter_pair_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`pages_blocks_litter_puppies\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`show_sold\` integer DEFAULT false,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_puppies_order_idx\` ON \`pages_blocks_litter_puppies\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_puppies_parent_id_idx\` ON \`pages_blocks_litter_puppies\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_puppies_path_idx\` ON \`pages_blocks_litter_puppies\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_puppies_litter_idx\` ON \`pages_blocks_litter_puppies\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_litter_header\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_header_order_idx\` ON \`_pages_v_blocks_litter_header\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_header_parent_id_idx\` ON \`_pages_v_blocks_litter_header\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_header_path_idx\` ON \`_pages_v_blocks_litter_header\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_header_litter_idx\` ON \`_pages_v_blocks_litter_header\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_litter_pair_card\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_pair_card_order_idx\` ON \`_pages_v_blocks_litter_pair_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_pair_card_parent_id_idx\` ON \`_pages_v_blocks_litter_pair_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_pair_card_path_idx\` ON \`_pages_v_blocks_litter_pair_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_pair_card_litter_idx\` ON \`_pages_v_blocks_litter_pair_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_litter_puppies\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`litter_id\` integer,
  	\`show_sold\` integer DEFAULT false,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`litter_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_puppies_order_idx\` ON \`_pages_v_blocks_litter_puppies\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_puppies_parent_id_idx\` ON \`_pages_v_blocks_litter_puppies\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_puppies_path_idx\` ON \`_pages_v_blocks_litter_puppies\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_puppies_litter_idx\` ON \`_pages_v_blocks_litter_puppies\` (\`litter_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_litter_header\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_litter_pair_card\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_litter_puppies\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_litter_header\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_litter_pair_card\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_litter_puppies\`;`);
}
