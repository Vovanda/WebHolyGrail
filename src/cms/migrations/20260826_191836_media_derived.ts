// @safe-bluegreen — новая колонка с пометкой уже существующих обложек.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`derived\` integer DEFAULT false;`);
  await db.run(sql`CREATE INDEX \`media_derived_idx\` ON \`media\` (\`derived\`);`);
  // Обложки, снятые до появления признака, помечаем по папке, в которой они
  // лежат: другого следа их происхождения в базе нет.
  await db.run(sql`UPDATE \`media\` SET \`derived\` = true WHERE \`prefix\` = 'previews';`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX \`media_derived_idx\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`derived\`;`);
}
