// @safe-bluegreen - миграция expand-only: новые таблицы разделов каталога и колонки позиций, прежняя версия их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`offers_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` integer,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`offers_rels_order_idx\` ON \`offers_rels\` (\`order\`);`);
  await db.run(sql`CREATE INDEX \`offers_rels_parent_idx\` ON \`offers_rels\` (\`parent_id\`);`);
  await db.run(sql`CREATE INDEX \`offers_rels_path_idx\` ON \`offers_rels\` (\`path\`);`);
  await db.run(sql`CREATE INDEX \`offers_rels_media_id_idx\` ON \`offers_rels\` (\`media_id\`);`);
  await db.run(sql`CREATE TABLE \`catalog_sections_characteristics\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`key\` text NOT NULL,
  	\`unit\` text,
  	\`kind\` text DEFAULT 'enum' NOT NULL,
  	\`filter\` text DEFAULT 'checks' NOT NULL,
  	\`group\` text,
  	\`in_card\` integer DEFAULT true,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`catalog_sections\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`catalog_sections_characteristics_order_idx\` ON \`catalog_sections_characteristics\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_characteristics_parent_id_idx\` ON \`catalog_sections_characteristics\` (\`_parent_id\`);`,
  );
  await db.run(sql`CREATE TABLE \`catalog_sections\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`slug\` text,
  	\`description\` text,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );
  `);
  await db.run(
    sql`CREATE UNIQUE INDEX \`catalog_sections_slug_idx\` ON \`catalog_sections\` (\`slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_updated_at_idx\` ON \`catalog_sections\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`catalog_sections_created_at_idx\` ON \`catalog_sections\` (\`created_at\`);`,
  );
  await db.run(sql`ALTER TABLE \`offers\` ADD \`slug\` text;`);
  await db.run(
    sql`ALTER TABLE \`offers\` ADD \`section_id\` integer REFERENCES catalog_sections(id);`,
  );
  await db.run(sql`ALTER TABLE \`offers\` ADD \`description\` text;`);
  await db.run(sql`ALTER TABLE \`offers\` ADD \`specs\` text;`);
  await db.run(sql`CREATE UNIQUE INDEX \`offers_slug_idx\` ON \`offers\` (\`slug\`);`);
  await db.run(sql`CREATE INDEX \`offers_section_idx\` ON \`offers\` (\`section_id\`);`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`catalog_sections_id\` integer REFERENCES catalog_sections(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_catalog_sections_id_idx\` ON \`payload_locked_documents_rels\` (\`catalog_sections_id\`);`,
  );
}

/**
 * Откат снимает только своё: индексы и колонки, затем таблицы разделов.
 *
 * @remarks
 * Пересборка `offers` и `payload_locked_documents_rels` по списку колонок шаблона
 * снесла бы колонки, которые сайт добавил своими коллекциями. Колонка со своим
 * `REFERENCES` удаляется `DROP COLUMN`, когда снят её индекс.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_catalog_sections_id_idx\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`catalog_sections_id\`;`,
  );
  await db.run(sql`DROP INDEX IF EXISTS \`offers_slug_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`offers_section_idx\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`slug\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`section_id\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`description\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`specs\`;`);
  await db.run(sql`DROP TABLE \`offers_rels\`;`);
  await db.run(sql`DROP TABLE \`catalog_sections_characteristics\`;`);
  await db.run(sql`DROP TABLE \`catalog_sections\`;`);
}
