// @safe-bluegreen - миграция expand-only: родитель и картинка раздела каталога, прежняя версия их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`catalog_sections\` ADD \`parent_id\` integer REFERENCES catalog_sections(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`catalog_sections\` ADD \`image_id\` integer REFERENCES media(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_parent_idx\` ON \`catalog_sections\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_image_idx\` ON \`catalog_sections\` (\`image_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_catalog_sections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_catalog_sections\`("id", "title", "slug", "description", "updated_at", "created_at") SELECT "id", "title", "slug", "description", "updated_at", "created_at" FROM \`catalog_sections\`;`,
  );
  await db.run(sql`DROP TABLE \`catalog_sections\`;`);
  await db.run(sql`ALTER TABLE \`__new_catalog_sections\` RENAME TO \`catalog_sections\`;`);
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE UNIQUE INDEX \`catalog_sections_slug_idx\` ON \`catalog_sections\` (\`slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_updated_at_idx\` ON \`catalog_sections\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_created_at_idx\` ON \`catalog_sections\` (\`created_at\`);`,
  );
}
