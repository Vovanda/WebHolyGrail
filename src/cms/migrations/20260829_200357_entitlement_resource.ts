// @needs-maintenance - таблица прав пересоздаётся: цель права переезжает
// из колонки на подборку в связь, умеющую два вида объектов.
//
// Переносить нечего: выданных прав в базе нет. Появись они - перенос
// пришлось бы дописать здесь же, между созданием таблицы связей
// и удалением старой.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`entitlements_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`playlists_id\` integer,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`entitlements\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`entitlements_rels_order_idx\` ON \`entitlements_rels\` (\`order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_rels_parent_idx\` ON \`entitlements_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_rels_path_idx\` ON \`entitlements_rels\` (\`path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_rels_playlists_id_idx\` ON \`entitlements_rels\` (\`playlists_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_rels_media_id_idx\` ON \`entitlements_rels\` (\`media_id\`);`,
  );
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_entitlements\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`viewer_id\` integer,
  	\`phone\` text,
  	\`email\` text,
  	\`source\` text DEFAULT 'manual',
  	\`expires_at\` text,
  	\`note\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`viewer_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_entitlements\`("id", "viewer_id", "phone", "email", "source", "expires_at", "note", "updated_at", "created_at") SELECT "id", "viewer_id", "phone", "email", "source", "expires_at", "note", "updated_at", "created_at" FROM \`entitlements\`;`,
  );
  await db.run(sql`DROP TABLE \`entitlements\`;`);
  await db.run(sql`ALTER TABLE \`__new_entitlements\` RENAME TO \`entitlements\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(sql`CREATE INDEX \`entitlements_viewer_idx\` ON \`entitlements\` (\`viewer_id\`);`);
  await db.run(sql`CREATE INDEX \`entitlements_phone_idx\` ON \`entitlements\` (\`phone\`);`);
  await db.run(sql`CREATE INDEX \`entitlements_email_idx\` ON \`entitlements\` (\`email\`);`);
  await db.run(
    sql`CREATE INDEX \`entitlements_updated_at_idx\` ON \`entitlements\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_created_at_idx\` ON \`entitlements\` (\`created_at\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`entitlements_rels\`;`);
  await db.run(
    sql`ALTER TABLE \`entitlements\` ADD \`playlist_id\` integer NOT NULL REFERENCES playlists(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`entitlements_playlist_idx\` ON \`entitlements\` (\`playlist_id\`);`,
  );
}
