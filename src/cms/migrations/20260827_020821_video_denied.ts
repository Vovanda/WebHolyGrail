import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`video_denied_title\` text DEFAULT 'Откроется по коду доступа';`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_denied_note\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_denied_action_label\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_denied_action_href\` text;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`video_denied_not_ready_title\` text DEFAULT 'Видео ещё готовится к показу';`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_denied_title\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_denied_note\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_denied_action_label\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_denied_action_href\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_denied_not_ready_title\`;`);
}
