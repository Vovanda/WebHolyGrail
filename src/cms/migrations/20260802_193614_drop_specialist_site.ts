// @safe-bluegreen — удаление колонки личного сайта.
// Старый цвет её не читает: поле уже убрано из кода этим же релизом,
// а значение было только у одного специалиста и перенесено в youtube.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`specialists\` DROP COLUMN \`contacts_site\`;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`specialists\` ADD \`contacts_site\` text;`);
}
