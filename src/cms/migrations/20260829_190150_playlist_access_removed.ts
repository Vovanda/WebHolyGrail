// @needs-maintenance - снятие колонки: старый цвет, если он ещё жив, её читает.
// Терять нечего - значение объявлялось, но не читалось ни одним запросом.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`playlists\` DROP COLUMN \`access\`;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`playlists\` ADD \`access\` text DEFAULT 'public';`);
}
