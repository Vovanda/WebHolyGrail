import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Litters: добавляем `letter` (буква помёта, translit) и убираем `slug`.
 *
 * URL детальной страницы помёта генерится из `dob + letter`
 * (`/puppies/<YYYY-MM-DD>/<letter>`), отдельный slug не нужен.
 *
 * Бэкфил: существующая запись id=3 (литера Н) → letter='n'.
 *
 * Создан вручную, drizzle-snapshot не обновлён — следующая `migrate:create`
 * заметит `letter` как «новую» колонку и спросит. Отвечать «create».
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`litters\` ADD \`letter\` text;`);
  await db.run(sql`CREATE INDEX \`litters_letter_idx\` ON \`litters\` (\`letter\`);`);
  await db.run(sql`ALTER TABLE \`_litters_v\` ADD \`version_letter\` text;`);
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_letter_idx\` ON \`_litters_v\` (\`version_letter\`);`,
  );

  // Бэкфил: текущий помёт «литера Н».
  await db.run(sql`UPDATE \`litters\` SET \`letter\` = 'n' WHERE \`id\` = 3;`);
  await db.run(sql`UPDATE \`_litters_v\` SET \`version_letter\` = 'n' WHERE \`parent_id\` = 3;`);

  // Старый `slug` больше не нужен. SQLite ≥3.35 поддерживает DROP COLUMN.
  // _litters_v.version_slug имеет индекс с генерируемым именем (двойной
  // version_), его нужно дропнуть до DROP COLUMN.
  await db.run(sql`DROP INDEX IF EXISTS \`litters_slug_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`_litters_v_version_version_slug_idx\`;`);
  await db.run(sql`ALTER TABLE \`litters\` DROP COLUMN \`slug\`;`);
  await db.run(sql`ALTER TABLE \`_litters_v\` DROP COLUMN \`version_slug\`;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`litters\` ADD \`slug\` text;`);
  await db.run(sql`CREATE UNIQUE INDEX \`litters_slug_idx\` ON \`litters\` (\`slug\`);`);
  await db.run(sql`ALTER TABLE \`_litters_v\` ADD \`version_slug\` text;`);

  await db.run(sql`UPDATE \`litters\` SET \`slug\` = 'litera-n-2026' WHERE \`id\` = 3;`);
  await db.run(
    sql`UPDATE \`_litters_v\` SET \`version_slug\` = 'litera-n-2026' WHERE \`parent_id\` = 3;`,
  );

  await db.run(sql`DROP INDEX IF EXISTS \`litters_letter_idx\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`_litters_v_version_letter_idx\`;`);
  await db.run(sql`ALTER TABLE \`litters\` DROP COLUMN \`letter\`;`);
  await db.run(sql`ALTER TABLE \`_litters_v\` DROP COLUMN \`version_letter\`;`);
}
