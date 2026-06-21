import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Litters.dobApprox (text) — текстовое описание даты рождения для анонсов
 * без точной даты («весна 2026», «после вязки осенью»). Также сделал
 * `dob` и `letter` опциональными в Payload-схеме — на БД это уже было
 * допустимо (колонки не имели NOT NULL констрейнт).
 *
 * Колонка добавляется в `litters` + версии `_litters_v`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`litters\` ADD COLUMN \`dob_approx\` text;`);
  await db.run(sql`ALTER TABLE \`_litters_v\` ADD COLUMN \`version_dob_approx\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`_litters_v\` DROP COLUMN \`version_dob_approx\`;`);
  await db.run(sql`ALTER TABLE \`litters\` DROP COLUMN \`dob_approx\`;`);
}
