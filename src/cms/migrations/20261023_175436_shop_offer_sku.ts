// @safe-bluegreen - миграция expand-only: колонка артикула позиции, прежняя версия её не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offers\` ADD \`sku\` text;`);
  await db.run(sql`CREATE INDEX \`offers_sku_idx\` ON \`offers\` (\`sku\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`offers_sku_idx\`;`);
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`sku\`;`);
}
