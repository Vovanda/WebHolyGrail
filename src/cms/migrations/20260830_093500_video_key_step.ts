// @safe-bluegreen — expand-only: одна новая колонка у записей. Старый цвет
// о ней не знает и продолжает отдавать единственный ключ, как отдавал.
//
// Шаг зоны хранится у записи, а не берётся из настройки во время выдачи.
// Настройку владелец меняет когда угодно, и выдача, поделившая номер части
// на новое значение, посчитала бы другую зону — уже нарезанные записи
// перестали бы играть беззвучно, все разом.
//
// Пусто означает запись, нарезанную до появления зон: у неё единственный
// ключ, и перезаливать её нельзя (R10).
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_key_step\` numeric;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_key_step\`;`);
}
