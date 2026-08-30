// Идентичность зрителя у права: по нему находится доступ того, кто не заводил
// учётной записи. Раньше такое право лежало в токене и записи не имело -
// отозвать его было нельзя, сервер о нём не знал.
//
// Только добавление колонки: выданные права остаются на месте, у них идентичность
// пусто - они держатся учётной записью.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`entitlements\` ADD \`ref\` text;`);
  await db.run(sql`CREATE INDEX \`entitlements_ref_idx\` ON \`entitlements\` (\`ref\`);`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`entitlements_ref_idx\`;`);
  await db.run(sql`ALTER TABLE \`entitlements\` DROP COLUMN \`ref\`;`);
}
