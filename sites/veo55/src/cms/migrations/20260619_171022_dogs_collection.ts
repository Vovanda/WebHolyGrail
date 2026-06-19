import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`dogs_photos\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`dogs_photos_order_idx\` ON \`dogs_photos\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`dogs_photos_parent_id_idx\` ON \`dogs_photos\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`dogs_photos_image_idx\` ON \`dogs_photos\` (\`image_id\`);`);
  await db.run(sql`CREATE TABLE \`dogs_titles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`year\` numeric,
  	\`place\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`dogs_titles_order_idx\` ON \`dogs_titles\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`dogs_titles_parent_id_idx\` ON \`dogs_titles\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`dogs\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`slug\` text,
  	\`sex\` text,
  	\`dob\` text,
  	\`color\` text,
  	\`description\` text,
  	\`pedigree_url\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft'
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`dogs_slug_idx\` ON \`dogs\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`dogs_updated_at_idx\` ON \`dogs\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`dogs_created_at_idx\` ON \`dogs\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`dogs__status_idx\` ON \`dogs\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`_dogs_v_version_photos\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_dogs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_photos_order_idx\` ON \`_dogs_v_version_photos\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_photos_parent_id_idx\` ON \`_dogs_v_version_photos\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_photos_image_idx\` ON \`_dogs_v_version_photos\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_dogs_v_version_titles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`text\` text,
  	\`year\` numeric,
  	\`place\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_dogs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_titles_order_idx\` ON \`_dogs_v_version_titles\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_titles_parent_id_idx\` ON \`_dogs_v_version_titles\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_dogs_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_name\` text,
  	\`version_slug\` text,
  	\`version_sex\` text,
  	\`version_dob\` text,
  	\`version_color\` text,
  	\`version_description\` text,
  	\`version_pedigree_url\` text,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`_dogs_v_parent_idx\` ON \`_dogs_v\` (\`parent_id\`);`);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_version_slug_idx\` ON \`_dogs_v\` (\`version_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_version_updated_at_idx\` ON \`_dogs_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_version_created_at_idx\` ON \`_dogs_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_version__status_idx\` ON \`_dogs_v\` (\`version__status\`);`,
  );
  await db.run(sql`CREATE INDEX \`_dogs_v_created_at_idx\` ON \`_dogs_v\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`_dogs_v_updated_at_idx\` ON \`_dogs_v\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`_dogs_v_latest_idx\` ON \`_dogs_v\` (\`latest\`);`);
  await db.run(sql`CREATE INDEX \`_dogs_v_autosave_idx\` ON \`_dogs_v\` (\`autosave\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`dogs_id\` integer REFERENCES dogs(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_dogs_id_idx\` ON \`payload_locked_documents_rels\` (\`dogs_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`dogs_photos\`;`);
  await db.run(sql`DROP TABLE \`dogs_titles\`;`);
  await db.run(sql`DROP TABLE \`dogs\`;`);
  await db.run(sql`DROP TABLE \`_dogs_v_version_photos\`;`);
  await db.run(sql`DROP TABLE \`_dogs_v_version_titles\`;`);
  await db.run(sql`DROP TABLE \`_dogs_v\`;`);
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
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id" FROM \`payload_locked_documents_rels\`;`,
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
}
