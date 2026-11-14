// @safe-bluegreen - миграция expand-only: колонка доли скидки у строки счёта, прежняя версия её не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/*
  Drizzle предлагал ещё пересобрать invoices_extra_lines ради снятия NOT NULL с kind:
  поле в форме стоит под условием массива. Пересборка таблицы ради этого не нужна -
  kind всегда пишется (умолчание 'charge'), поэтому здесь только новая колонка.
*/
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`invoices_lines\` ADD \`discount_micros\` numeric;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`invoices_lines\` DROP COLUMN \`discount_micros\`;`);
}
