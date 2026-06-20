import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Hot-fix к `20260620_165000_posts_collection`: Payload требует
 * `payload_locked_documents_rels.posts_id` для polymorphic-relation на новую
 * коллекцию (без него любой update коллекции с lock-проверкой падает).
 *
 * Добавляем колонку + индекс. Аналогично сделано для dogs/litters/reusable_blocks
 * в их миграциях.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`posts_id\` integer REFERENCES posts(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_posts_id_idx\` ON \`payload_locked_documents_rels\` (\`posts_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_posts_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`posts_id\`;`);
}
