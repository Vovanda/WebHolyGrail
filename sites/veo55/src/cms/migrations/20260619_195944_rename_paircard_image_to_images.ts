import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`litters_pair_card_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`litters\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`litters_pair_card_images_order_idx\` ON \`litters_pair_card_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_pair_card_images_parent_id_idx\` ON \`litters_pair_card_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_pair_card_images_image_idx\` ON \`litters_pair_card_images\` (\`image_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`_litters_v_version_pair_card_images\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`image_id\` integer,
  	\`_uuid\` text,
  	FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_litters_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_pair_card_images_order_idx\` ON \`_litters_v_version_pair_card_images\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_pair_card_images_parent_id_idx\` ON \`_litters_v_version_pair_card_images\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_pair_card_images_image_idx\` ON \`_litters_v_version_pair_card_images\` (\`image_id\`);`,
  );
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_litters\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`slug\` text,
  	\`dob\` text,
  	\`status\` text DEFAULT 'active',
  	\`mother_id\` integer,
  	\`father_id\` integer,
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
  	FOREIGN KEY (\`father_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_litters\`("id", "title", "slug", "dob", "status", "mother_id", "father_id", "pair_card_caption", "description", "show_mother_titles", "show_mother_description", "show_father_titles", "show_father_description", "updated_at", "created_at", "_status") SELECT "id", "title", "slug", "dob", "status", "mother_id", "father_id", "pair_card_caption", "description", "show_mother_titles", "show_mother_description", "show_father_titles", "show_father_description", "updated_at", "created_at", "_status" FROM \`litters\`;`,
  );
  await db.run(sql`DROP TABLE \`litters\`;`);
  await db.run(sql`ALTER TABLE \`__new_litters\` RENAME TO \`litters\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE UNIQUE INDEX \`litters_slug_idx\` ON \`litters\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`litters_mother_idx\` ON \`litters\` (\`mother_id\`);`);
  await db.run(sql`CREATE INDEX \`litters_father_idx\` ON \`litters\` (\`father_id\`);`);
  await db.run(sql`CREATE INDEX \`litters_updated_at_idx\` ON \`litters\` (\`updated_at\`);`);
  await db.run(sql`CREATE INDEX \`litters_created_at_idx\` ON \`litters\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`litters__status_idx\` ON \`litters\` (\`_status\`);`);
  await db.run(sql`CREATE TABLE \`__new__litters_v\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`parent_id\` integer,
  	\`version_title\` text,
  	\`version_slug\` text,
  	\`version_dob\` text,
  	\`version_status\` text DEFAULT 'active',
  	\`version_mother_id\` integer,
  	\`version_father_id\` integer,
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
  	FOREIGN KEY (\`version_father_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__litters_v\`("id", "parent_id", "version_title", "version_slug", "version_dob", "version_status", "version_mother_id", "version_father_id", "version_pair_card_caption", "version_description", "version_show_mother_titles", "version_show_mother_description", "version_show_father_titles", "version_show_father_description", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave") SELECT "id", "parent_id", "version_title", "version_slug", "version_dob", "version_status", "version_mother_id", "version_father_id", "version_pair_card_caption", "version_description", "version_show_mother_titles", "version_show_mother_description", "version_show_father_titles", "version_show_father_description", "version_updated_at", "version_created_at", "version__status", "created_at", "updated_at", "latest", "autosave" FROM \`_litters_v\`;`,
  );
  await db.run(sql`DROP TABLE \`_litters_v\`;`);
  await db.run(sql`ALTER TABLE \`__new__litters_v\` RENAME TO \`_litters_v\`;`);
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`litters_pair_card_images\`;`);
  await db.run(sql`DROP TABLE \`_litters_v_version_pair_card_images\`;`);
  await db.run(
    sql`ALTER TABLE \`litters\` ADD \`pair_card_image_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_pair_card_pair_card_image_idx\` ON \`litters\` (\`pair_card_image_id\`);`,
  );
  await db.run(
    sql`ALTER TABLE \`_litters_v\` ADD \`version_pair_card_image_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_pair_card_version_pair_card_image_idx\` ON \`_litters_v\` (\`version_pair_card_image_id\`);`,
  );
}
