import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Поле «Вид плеера» уходит из настроек: выбор слоя живёт переключателем.
 *
 * @remarks
 * Второй шаг перехода. Первым сборка сайта перестала читать поле и уехала на
 * рабочий сайт; теперь ни одна живая сборка о колонке не спрашивает, и её можно
 * убрать. Порядок именно такой: убери колонку сразу - прежняя сборка, которая
 * во время выкладки работает рядом с новой, споткнулась бы об исчезнувшее поле.
 *
 * Значение не переносим: признак video.layout.vendor заводится стартовым
 * набором, а выбор слоя всё это время был одинаков у всех.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_player_ui\`;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_player_ui\` text DEFAULT 'vidstack';`);
}
