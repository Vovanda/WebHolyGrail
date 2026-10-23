// @safe-bluegreen - миграция expand-only: отметка «в быстрых фильтрах» у характеристики раздела, прежняя версия её не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`catalog_sections_characteristics\` ADD \`quick\` integer DEFAULT false;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`catalog_sections_characteristics\` DROP COLUMN \`quick\`;`);
}
