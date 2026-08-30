// @safe-bluegreen — добавляется колонка, прежний код её не читает.
//
// Срок доступа теперь считается и в минутах: у показа или демонстрации он
// короче суток, а дробить дни было бы враньём в названии поля.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`access_codes\` ADD \`grant_minutes\` numeric;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`access_codes\` DROP COLUMN \`grant_minutes\`;`);
}
