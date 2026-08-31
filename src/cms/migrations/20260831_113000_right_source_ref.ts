// @safe-bluegreen - колонка только добавляется, старый цвет её не читает
//
// «Чем выдан» говорит про способ - оплата, приглашение, код. Здесь стоит,
// чем именно: сам код или номер платежа. Без этого платёж с выданным доступом
// не сопоставить, когда придёт биллинг: способ у всех покупок один.
//
// Выданное прежде остаётся без номера и живёт как жило.
import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media_access_rights\` ADD \`source_ref\` text;`);
  await db.run(
    sql`CREATE INDEX \`media_access_rights_source_ref_idx\` ON \`media_access_rights\` (\`source_ref\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`media_access_rights_source_ref_idx\`;`);
  await db.run(sql`ALTER TABLE \`media_access_rights\` DROP COLUMN \`source_ref\`;`);
}
