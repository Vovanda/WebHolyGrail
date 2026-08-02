// @safe-bluegreen — колонка YouTube в контактах
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`specialists\` ADD \`contacts_youtube\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`specialists\` DROP COLUMN \`contacts_youtube\`;`);
}
