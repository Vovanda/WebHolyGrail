import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Hot-fix к `20260620_135000_pedigree`: version-array у коллекций именуется
 * `_<col>_v_version_<field>`, а не `_<col>_v_<field>` (есть double-`version`
 * префикс — см. `_dogs_v_version_photos` / `_dogs_v_version_titles`). Я
 * сделал `_dogs_v_pedigree` и при list-запросе Drizzle упал
 * `no such table: _dogs_v_version_pedigree`.
 *
 * Переименовываем таблицу и индексы. Данных в таблице ещё нет — нечего
 * терять. Down — обратно.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`_dogs_v_pedigree_order_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`_dogs_v_pedigree_parent_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`_dogs_v_pedigree\` RENAME TO \`_dogs_v_version_pedigree\`;`);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_pedigree_order_idx\` ON \`_dogs_v_version_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_pedigree_parent_id_idx\` ON \`_dogs_v_version_pedigree\` (\`_parent_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`_dogs_v_version_pedigree_order_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`_dogs_v_version_pedigree_parent_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`_dogs_v_version_pedigree\` RENAME TO \`_dogs_v_pedigree\`;`);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_pedigree_order_idx\` ON \`_dogs_v_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_pedigree_parent_id_idx\` ON \`_dogs_v_pedigree\` (\`_parent_id\`);`,
  );
}
