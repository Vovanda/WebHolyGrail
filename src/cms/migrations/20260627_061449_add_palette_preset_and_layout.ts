import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen — expand-only: ADD COLUMN с дефолтом, старый код игнорирует.
// Остальные palette + layout columns уже applied в предыдущей миграции
// 20260627_060552_add_palette_and_layout (файл удалён локально, но запись
// в payload_migrations table осталась — drizzle snapshot десинхронизирован,
// поэтому вместо drizzle-сгенерённого DROP+ADD пишем минимум вручную.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_preset\` text DEFAULT 'whg-default';`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_preset\`;`);
}
