// @safe-bluegreen - миграция только добавляет колонки, старый код на новой схеме живёт
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`blur_data\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_wide_url\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_wide_width\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_wide_height\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_wide_mime_type\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_wide_filesize\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_wide_filename\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_full_url\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_full_width\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_full_height\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_full_mime_type\` text;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_full_filesize\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`sizes_full_filename\` text;`);
  await db.run(
    sql`CREATE INDEX \`media_sizes_wide_sizes_wide_filename_idx\` ON \`media\` (\`sizes_wide_filename\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_sizes_full_sizes_full_filename_idx\` ON \`media\` (\`sizes_full_filename\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`media_sizes_wide_sizes_wide_filename_idx\`;`);
  await db.run(sql`DROP INDEX \`media_sizes_full_sizes_full_filename_idx\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`blur_data\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_wide_url\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_wide_width\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_wide_height\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_wide_mime_type\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_wide_filesize\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_wide_filename\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_full_url\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_full_width\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_full_height\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_full_mime_type\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_full_filesize\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`sizes_full_filename\`;`);
}
