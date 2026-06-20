import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Hot-fix к `20260620_170000_social_feed_block`: для `select hasMany` таблиц
 * (`*_sources`) Payload не передаёт `id` в INSERT — ожидает autoincrement.
 * Я сделал `id text PRIMARY KEY NOT NULL` — упало на seed.
 *
 * Пересоздаю эти 4 таблицы с `id integer PRIMARY KEY AUTOINCREMENT`. Данные
 * там ещё ничего нет (миграция вчера, ни одного post-блока ещё не создан),
 * можно дропнуть без потерь.
 */
const tables = [
  {
    name: 'pages_blocks_social_feed_sources',
    parent: 'pages_blocks_social_feed',
    parentIdType: 'text',
  },
  {
    name: '_pages_v_blocks_social_feed_sources',
    parent: '_pages_v_blocks_social_feed',
    parentIdType: 'integer',
  },
  {
    name: 'reusable_blocks_blocks_social_feed_sources',
    parent: 'reusable_blocks_blocks_social_feed',
    parentIdType: 'text',
  },
  {
    name: '_reusable_blocks_v_blocks_social_feed_sources',
    parent: '_reusable_blocks_v_blocks_social_feed',
    parentIdType: 'integer',
  },
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const t of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS \`${t.name}\`;`));
    await db.run(
      sql.raw(`CREATE TABLE \`${t.name}\` (
        \`order\` integer NOT NULL,
        \`parent_id\` ${t.parentIdType} NOT NULL,
        \`value\` text,
        \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        FOREIGN KEY (\`parent_id\`) REFERENCES \`${t.parent}\`(\`id\`) ON UPDATE no action ON DELETE cascade
      );`),
    );
    await db.run(sql.raw(`CREATE INDEX \`${t.name}_order_idx\` ON \`${t.name}\` (\`order\`);`));
    await db.run(
      sql.raw(`CREATE INDEX \`${t.name}_parent_id_idx\` ON \`${t.name}\` (\`parent_id\`);`),
    );
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Откат к text id (не имеет практического смысла, оставляем для полноты).
  for (const t of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS \`${t.name}\`;`));
    await db.run(
      sql.raw(`CREATE TABLE \`${t.name}\` (
        \`order\` integer NOT NULL,
        \`parent_id\` ${t.parentIdType} NOT NULL,
        \`value\` text,
        \`id\` text PRIMARY KEY NOT NULL,
        FOREIGN KEY (\`parent_id\`) REFERENCES \`${t.parent}\`(\`id\`) ON UPDATE no action ON DELETE cascade
      );`),
    );
  }
}
