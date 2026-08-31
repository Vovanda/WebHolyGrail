// @safe-bluegreen - колонки только добавляются, старый цвет их не читает
//
// Ключ доступа рядом с паролем: пароль открывает админку человеку, ключ - наполнение
// сайта запросами. У ключа свой отзыв, и снять его можно, не трогая пароль.
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` ADD \`enable_a_p_i_key\` integer;`);
  await db.run(sql`ALTER TABLE \`users\` ADD \`api_key\` text;`);
  await db.run(sql`ALTER TABLE \`users\` ADD \`api_key_index\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`api_key_index\`;`);
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`api_key\`;`);
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`enable_a_p_i_key\`;`);
}
