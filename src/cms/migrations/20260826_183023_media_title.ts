// @safe-bluegreen — добавляет колонку и заполняет её из уже существующих данных.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Имя документа для интерфейса.
 *
 * @remarks
 * Написано руками, а не сгенерировано: drizzle предложил пересоздать `media`
 * целиком, а на неё ссылаются обложки, наборы и связи блоков. Пересоздание
 * упирается во внешние ключи, отключить которые внутри транзакции SQLite не
 * даёт, и прогон падал на `DROP TABLE media`.
 *
 * Добавление колонки таких последствий не имеет и данные не трогает.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` ADD \`title\` text;`);
  await db.run(sql`CREATE INDEX \`media_title_idx\` ON \`media\` (\`title\`);`);
  // У загруженного раньше заголовка нет: берём название, а если его не
  // задавали — имя файла, как было до этого изменения.
  await db.run(
    sql`UPDATE \`media\` SET \`title\` = COALESCE(NULLIF(\`caption\`, ''), \`filename\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`media_title_idx\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`title\`;`);
}
