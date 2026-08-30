import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`access_codes_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`playlists_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`access_codes\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`access_codes_rels_order_idx\` ON \`access_codes_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_rels_parent_idx\` ON \`access_codes_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_rels_path_idx\` ON \`access_codes_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_rels_playlists_id_idx\` ON \`access_codes_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_rels_media_id_idx\` ON \`access_codes_rels\` (\`media_id\`);`,
  );
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_access_codes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text,
  	\`playlist_id\` integer,
  	\`requires_sign_in\` integer DEFAULT true,
  	\`max_uses\` numeric,
  	\`used_count\` numeric DEFAULT 0,
  	\`expires_at\` text,
  	\`grant_days\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_access_codes\`("id", "code", "playlist_id", "requires_sign_in", "max_uses", "used_count", "expires_at", "grant_days", "updated_at", "created_at") SELECT "id", "code", "playlist_id", "requires_sign_in", "max_uses", "used_count", "expires_at", "grant_days", "updated_at", "created_at" FROM \`access_codes\`;`,
  );
  await db.run(sql`DROP TABLE \`access_codes\`;`);
  await db.run(sql`ALTER TABLE \`__new_access_codes\` RENAME TO \`access_codes\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE UNIQUE INDEX \`access_codes_code_idx\` ON \`access_codes\` (\`code\`);`);
  await db.run(
    sql`CREATE INDEX \`access_codes_playlist_idx\` ON \`access_codes\` (\`playlist_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_updated_at_idx\` ON \`access_codes\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_created_at_idx\` ON \`access_codes\` (\`created_at\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`access_codes_rels\`;`);
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_access_codes\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`code\` text,
  	\`playlist_id\` integer NOT NULL,
  	\`requires_sign_in\` integer DEFAULT true,
  	\`max_uses\` numeric,
  	\`used_count\` numeric DEFAULT 0,
  	\`expires_at\` text,
  	\`grant_days\` numeric,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`playlist_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_access_codes\`("id", "code", "playlist_id", "requires_sign_in", "max_uses", "used_count", "expires_at", "grant_days", "updated_at", "created_at") SELECT "id", "code", "playlist_id", "requires_sign_in", "max_uses", "used_count", "expires_at", "grant_days", "updated_at", "created_at" FROM \`access_codes\`;`,
  );
  await db.run(sql`DROP TABLE \`access_codes\`;`);
  await db.run(sql`ALTER TABLE \`__new_access_codes\` RENAME TO \`access_codes\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE UNIQUE INDEX \`access_codes_code_idx\` ON \`access_codes\` (\`code\`);`);
  await db.run(
    sql`CREATE INDEX \`access_codes_playlist_idx\` ON \`access_codes\` (\`playlist_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_updated_at_idx\` ON \`access_codes\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`access_codes_created_at_idx\` ON \`access_codes\` (\`created_at\`);`,
  );
}
