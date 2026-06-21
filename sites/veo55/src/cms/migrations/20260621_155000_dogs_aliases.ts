import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Dogs.aliases — массив прозвищ/сокращений для подсветки в VK-постах.
 *
 * Зачем: `detectDogMentions` в SocialText матчит `Dogs.name` целиком — «ОМСКАЯ
 * ДРУЖИНА МАРТА» совпадёт, а короткая «Марта» из текста поста — нет. Aliases
 * расширяют список триггеров без размывания основного имени.
 *
 * Структура — стандартная Payload array sub-table (как `dogs_titles`).
 * Параллельная version table `_dogs_v_version_aliases` — для drafts/versions
 * (включены у Dogs).
 *
 * Файл написан вручную (не drizzle-kit) — drizzle-kit при `migrate:create`
 * требовал rename-confirmation для удалённого `litter_card` блока, что не
 * автоматизируется в non-TTY. Структуру скопировал с существующей `dogs_titles`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    CREATE TABLE \`dogs_aliases\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`alias\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `);
  await db.run(sql`CREATE INDEX \`dogs_aliases_order_idx\` ON \`dogs_aliases\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`dogs_aliases_parent_id_idx\` ON \`dogs_aliases\` (\`_parent_id\`);`,
  );

  await db.run(sql`
    CREATE TABLE \`_dogs_v_version_aliases\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`alias\` text,
      \`_uuid\` text,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_dogs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_aliases_order_idx\` ON \`_dogs_v_version_aliases\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_aliases_parent_id_idx\` ON \`_dogs_v_version_aliases\` (\`_parent_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`_dogs_v_version_aliases\`;`);
  await db.run(sql`DROP TABLE \`dogs_aliases\`;`);
}
