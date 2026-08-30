// @safe-bluegreen — expand-only: одна новая колонка в настройках сайта.
// Старый цвет её не читает и режет по-прежнему, одним ключом на запись.
//
// Настройка задаёт, сколько частей идёт под одним ключом, и действует только
// на то, что нарезается после её изменения: у записи шаг лежит свой.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_key_step\` numeric DEFAULT 15;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_key_step\`;`);
}
