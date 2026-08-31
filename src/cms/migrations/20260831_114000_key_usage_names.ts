// @safe-bluegreen - колонки переименовываются, но прежний цвет это переживает:
// счёт выдачи он читает через попытку, и нечитаемый счёт для него значит
// «счёта нет» - ключи продолжают выдаваться, запас начинается заново.
//
// `left`, `at`, `seen` не говорят ни о чём: остаток чего, когда что, увидено
// кем. Подписи в админке давно называют вещи прямо, а имена в базе и коде
// от них отстали.
//
// Данные переносятся: счёт выдачи ключей продолжается, а не начинается заново.
// Переименование, а не пара «создать - удалить»: значения остаются на месте
// сами, и промежутка, когда счёт пуст, не возникает.
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`key_usage\` RENAME COLUMN \`left\` TO \`keys_left\`;`);
  await db.run(sql`ALTER TABLE \`key_usage\` RENAME COLUMN \`at\` TO \`counted_at\`;`);
  await db.run(sql`ALTER TABLE \`key_usage\` RENAME COLUMN \`seen\` TO \`issued_keys\`;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`key_usage\` RENAME COLUMN \`issued_keys\` TO \`seen\`;`);
  await db.run(sql`ALTER TABLE \`key_usage\` RENAME COLUMN \`counted_at\` TO \`at\`;`);
  await db.run(sql`ALTER TABLE \`key_usage\` RENAME COLUMN \`keys_left\` TO \`left\`;`);
}
