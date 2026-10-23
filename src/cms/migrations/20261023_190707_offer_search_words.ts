// @safe-bluegreen - миграция expand-only: другие названия и теги позиции для поиска, прежняя версия их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`offers_texts\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer NOT NULL,
  	\`parent_id\` integer NOT NULL,
  	\`path\` text NOT NULL,
  	\`text\` text,
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`offers\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`offers_texts_order_parent\` ON \`offers_texts\` (\`order\`,\`parent_id\`);`,
  );
  await db.run(sql`ALTER TABLE \`offers\` ADD \`keywords\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`offers_texts\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`keywords\`;`);
}
