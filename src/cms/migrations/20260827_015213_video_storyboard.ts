import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_url\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_columns\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_rows\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_count\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_frame_width\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_frame_height\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_storyboard_interval_seconds\` numeric;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_url\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_columns\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_rows\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_count\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_frame_width\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_frame_height\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_storyboard_interval_seconds\`;`);
}
