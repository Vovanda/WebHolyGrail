import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Dogs.kennel + Dogs.breeder — два text-поля для собак не из «Омской Дружины»
 * (привозные производители). Опциональные. Versions/drafts включены, потому
 * v-таблица повторяет операцию.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await addColumnIfMissing(db, 'dogs', 'kennel', 'text');
  await addColumnIfMissing(db, 'dogs', 'breeder', 'text');
  await addColumnIfMissing(db, '_dogs_v', 'version_kennel', 'text');
  await addColumnIfMissing(db, '_dogs_v', 'version_breeder', 'text');
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`dogs\` DROP COLUMN \`kennel\`;`);
  await db.run(sql`ALTER TABLE \`dogs\` DROP COLUMN \`breeder\`;`);
  await db.run(sql`ALTER TABLE \`_dogs_v\` DROP COLUMN \`version_kennel\`;`);
  await db.run(sql`ALTER TABLE \`_dogs_v\` DROP COLUMN \`version_breeder\`;`);
}

async function addColumnIfMissing(
  db: MigrateUpArgs['db'],
  table: string,
  column: string,
  type: string,
): Promise<void> {
  const cols = await db.all<{ name: string }>(sql.raw(`PRAGMA table_info(\`${table}\`);`));
  if (!cols.some((c) => c.name === column)) {
    await db.run(sql.raw(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type};`));
  }
}
