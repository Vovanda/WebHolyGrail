import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`litters_puppies\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`sex\` text,
  	\`color\` text,
  	\`state\` text DEFAULT 'available',
  	\`photo_id\` integer,
  	\`notes\` text,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`litters_puppies_order_idx\` ON \`litters_puppies\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_puppies_parent_id_idx\` ON \`litters_puppies\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_puppies_photo_idx\` ON \`litters_puppies\` (\`photo_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`litters\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`dob\` text,
  	\`status\` text DEFAULT 'active',
  	\`mother_id\` integer,
  	\`father_id\` integer,
  	\`pair_card_image_id\` integer,
  	\`pair_card_caption\` text,
  	\`description\` text,
  	\`show_mother_titles\` integer DEFAULT true,
  	\`show_mother_description\` integer DEFAULT false,
  	\`show_father_titles\` integer DEFAULT true,
  	\`show_father_description\` integer DEFAULT false,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`_status\` text DEFAULT 'draft',
  	FOREIGN KEY (\`mother_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`father_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`pair_card_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE UNIQUE INDEX \`litters_slug_idx\` ON \`litters\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`litters_mother_idx\` ON \`litters\` (\`mother_id\`);`);
  await db.run(sql`CREATE INDEX \`litters_father_idx\` ON \`litters\` (\`father_id\`);`);
  await db.run(
    sql`CREATE INDEX \`litters_pair_card_pair_card_image_idx\` ON \`litters\` (\`pair_card_image_id\`);`,
  );
  await db.run(sql`CREATE INDEX \`litters_updated_at_idx\` ON \`litters\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`litters_created_at_idx\` ON \`litters\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`litters__status_idx\` ON \`litters\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`_litters_v_version_puppies\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`name\` text,
  	\`sex\` text,
  	\`color\` text,
  	\`state\` text DEFAULT 'available',
  	\`photo_id\` integer,
  	\`notes\` text,
  	\`_uuid\` text,
  	FOREIGN KEY (\`photo_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_litters_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_puppies_order_idx\` ON \`_litters_v_version_puppies\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_puppies_parent_id_idx\` ON \`_litters_v_version_puppies\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_puppies_photo_idx\` ON \`_litters_v_version_puppies\` (\`photo_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_litters_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_dob\` text,
  	\`version_status\` text DEFAULT 'active',
  	\`version_mother_id\` integer,
  	\`version_father_id\` integer,
  	\`version_pair_card_image_id\` integer,
  	\`version_pair_card_caption\` text,
  	\`version_description\` text,
  	\`version_show_mother_titles\` integer DEFAULT true,
  	\`version_show_mother_description\` integer DEFAULT false,
  	\`version_show_father_titles\` integer DEFAULT true,
  	\`version_show_father_description\` integer DEFAULT false,
  	\`version_updated_at\` text,
  	\`version_created_at\` text,
  	\`version__status\` text DEFAULT 'draft',
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`latest\` integer,
  	\`autosave\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_mother_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_father_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`version_pair_card_image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(sql`CREATE INDEX \`_litters_v_parent_idx\` ON \`_litters_v\` (\`parent_id\`);`);
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_version_slug_idx\` ON \`_litters_v\` (\`version_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_version_mother_idx\` ON \`_litters_v\` (\`version_mother_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_version_father_idx\` ON \`_litters_v\` (\`version_father_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_pair_card_version_pair_card_image_idx\` ON \`_litters_v\` (\`version_pair_card_image_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_version_updated_at_idx\` ON \`_litters_v\` (\`version_updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_version_created_at_idx\` ON \`_litters_v\` (\`version_created_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_version__status_idx\` ON \`_litters_v\` (\`version__status\`);`,
  );
  await db.run(sql`CREATE INDEX \`_litters_v_created_at_idx\` ON \`_litters_v\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`_litters_v_updated_at_idx\` ON \`_litters_v\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`_litters_v_latest_idx\` ON \`_litters_v\` (\`latest\`);`);
  await db.run(sql`CREATE INDEX \`_litters_v_autosave_idx\` ON \`_litters_v\` (\`autosave\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`litters_id\` integer REFERENCES litters(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_litters_id_idx\` ON \`payload_locked_documents_rels\` (\`litters_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`litters_puppies\`;`);
  await db.run(sql`DROP TABLE \`litters\`;`);
  await db.run(sql`DROP TABLE \`_litters_v_version_puppies\`;`);
  await db.run(sql`DROP TABLE \`_litters_v\`;`);
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
  	\`dogs_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`pages_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`form_submissions_id\`) REFERENCES \`form_submissions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`dogs_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "dogs_id") SELECT "id", "order", "parent_id", "path", "users_id", "media_id", "pages_id", "form_submissions_id", "dogs_id" FROM \`payload_locked_documents_rels\`;`,
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
    sql`CREATE INDEX \`payload_locked_documents_rels_dogs_id_idx\` ON \`payload_locked_documents_rels\` (\`dogs_id\`);`,
  );
}
