// @safe-bluegreen - новые колонки у Hero, старый цвет их не читает
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { addColumnIfMissing, hasTable } from '../src/lib/migrations/columns';

/**
 * Фото под текстом Hero и вуаль над ним.
 *
 * Каждая операция по факту: таблицы блока есть там, где его разрешили ставить.
 * Откат снимает только индексы - пустые колонки ничему не мешают, а пересоздание
 * таблиц по списку шаблона унесло бы колонки, добавленные сайтом.
 */
const TABLES = [
  'pages_blocks_hero',
  '_pages_v_blocks_hero',
  'reusable_blocks_blocks_hero',
  '_reusable_blocks_v_blocks_hero',
  'specialists_blocks_hero',
];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const table of TABLES) {
    if (!(await hasTable(db, table))) continue;
    await addColumnIfMissing(db, table, 'photo_id', 'integer REFERENCES media(id)');
    await addColumnIfMissing(db, table, 'veil', 'numeric');
    await db.run(
      sql.raw(`CREATE INDEX IF NOT EXISTS \`${table}_photo_idx\` ON \`${table}\` (\`photo_id\`);`),
    );
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const table of TABLES) {
    await db.run(sql.raw(`DROP INDEX IF EXISTS \`${table}_photo_idx\`;`));
  }
}
