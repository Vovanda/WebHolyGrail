import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite';

/**
 * Якорь схемы: состояние зафиксировано, изменений нет.
 *
 * @remarks
 * Схему меняли миграции до этой - свои и приехавшие из шаблона. Здесь только
 * снимок рядом, чтобы проверка расхождения сверялась со схемой этого сайта,
 * а не со схемой шаблона.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {
  // Схема не меняется.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Откатывать нечего.
}
