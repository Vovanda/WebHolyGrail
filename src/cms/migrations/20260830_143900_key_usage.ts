// @safe-bluegreen — новая таблица, прежний код о ней не знает и не читает.
//
// Счёт выданных ключей переезжает из памяти процесса в базу: при выкладке
// рядом работают два цвета на одной базе, и память у каждого своя - смена
// цвета возвращала выкачивающему полный запас.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS \`key_usage\` (
      \`id\` integer PRIMARY KEY NOT NULL,
      \`viewer\` text NOT NULL,
      \`left\` numeric NOT NULL,
      \`at\` numeric NOT NULL,
      \`seen\` text,
      \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    );
  `);

  // Опознание одно на строку: счёт у зрителя единственный, и искать его
  // приходится на каждый запрос ключа.
  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS \`key_usage_viewer_idx\` ON \`key_usage\` (\`viewer\`);`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`key_usage_updated_at_idx\` ON \`key_usage\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`key_usage_created_at_idx\` ON \`key_usage\` (\`created_at\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS \`key_usage\`;`);
}
