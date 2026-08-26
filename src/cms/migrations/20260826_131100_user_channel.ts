// @safe-bluegreen — expand-only: адрес канала у участника.
// Старый цвет о нём не знает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`channel\` text;`);
  await db.run(sql`CREATE UNIQUE INDEX \`users_channel_idx\` ON \`users\` (\`channel\`);`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`users_channel_idx\`;`);
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`channel\`;`);
}
