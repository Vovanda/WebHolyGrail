// @safe-bluegreen — expand-only: пометка удаления у media, срок уборки
// в настройках и служебные таблицы очереди. Старый цвет их не читает.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`payload_jobs_stats\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`stats\` text,
  	\`updated_at\` text,
  	\`created_at\` text
  );
  `);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_deleted_at\` text;`);
  await db.run(sql`ALTER TABLE \`payload_jobs\` ADD \`meta\` text;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`video_purge_after_days\` numeric DEFAULT 30;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`payload_jobs_stats\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_deleted_at\`;`);
  await db.run(sql`ALTER TABLE \`payload_jobs\` DROP COLUMN \`meta\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_purge_after_days\`;`);
}
