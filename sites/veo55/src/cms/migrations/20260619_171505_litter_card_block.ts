import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`pages_blocks_litter_card\` (
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
    sql`CREATE INDEX \`pages_blocks_litter_card_order_idx\` ON \`pages_blocks_litter_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_card_parent_id_idx\` ON \`pages_blocks_litter_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_card_path_idx\` ON \`pages_blocks_litter_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_litter_card_litter_idx\` ON \`pages_blocks_litter_card\` (\`litter_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_pages_v_blocks_litter_card\` (
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
    sql`CREATE INDEX \`_pages_v_blocks_litter_card_order_idx\` ON \`_pages_v_blocks_litter_card\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_card_parent_id_idx\` ON \`_pages_v_blocks_litter_card\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_card_path_idx\` ON \`_pages_v_blocks_litter_card\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_litter_card_litter_idx\` ON \`_pages_v_blocks_litter_card\` (\`litter_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`pages_blocks_litter_card\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_litter_card\`;`);
}
