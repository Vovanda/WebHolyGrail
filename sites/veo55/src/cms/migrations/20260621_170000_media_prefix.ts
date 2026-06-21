import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Media.prefix — текстовое поле для подпапки в S3 bucket.
 *
 * `@payloadcms/storage-s3` плагин читает doc.prefix и кладёт файл в
 * `s3://<bucket>/<prefix>/<filename>`. Без этого поля все файлы летят в
 * один collection-level prefix, что превращает bucket в свалку.
 *
 * Default `'media'` — для всех существующих записей без обновления данных.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Idempotent: dev-push мог уже добавить колонку при старте.
  const existing = await db.all<{ name: string }>(sql`PRAGMA table_info(\`media\`);`);
  if (!existing.some((c) => c.name === 'prefix')) {
    await db.run(sql`ALTER TABLE \`media\` ADD COLUMN \`prefix\` text DEFAULT 'media';`);
  }
  await db.run(sql`UPDATE \`media\` SET \`prefix\` = 'media' WHERE \`prefix\` IS NULL;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`prefix\`;`);
}
