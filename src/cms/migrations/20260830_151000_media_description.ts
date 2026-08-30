// @safe-bluegreen — добавляется колонка, прежний код её не читает.
//
// У записи появляется своё описание. До сих пор его роль играл `alt` - поле,
// заведённое для картинок и скринридеров: alt описывает изображение тому, кто
// его не видит, а описание рассказывает, о чём запись.
//
// Заполненный alt не трогаем: выдача читает его запасным вариантом, пока
// владелец не перенесёт текст руками.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`description\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`description\`;`);
}
