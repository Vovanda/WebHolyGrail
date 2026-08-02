// @safe-bluegreen — колонка якоря у формы заявки
// В перенос данных не входит: генератор тянул её из старой таблицы,
// где её ещё нет.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`anchor\` text;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`anchor\` text;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`anchor\` text;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`anchor\` text;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`anchor\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`anchor\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`anchor\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`anchor\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`anchor\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`anchor\`;`);
}
