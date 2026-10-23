// @safe-bluegreen - миграция expand-only: флаг своей страницы позиции, у прежних позиций включён, прежняя версия его не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offers\` ADD \`has_page\` integer DEFAULT true;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`offers\` DROP COLUMN \`has_page\`;`);
}
