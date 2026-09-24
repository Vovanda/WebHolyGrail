// @safe-bluegreen - таблицы строк галереи не выкладывались, старый цвет их не знает; колонки только добавляются
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { addColumnIfMissing, hasTable } from '../src/lib/migrations/columns';

/**
 * Кадры галереи - одно поле с несколькими файлами вместо списка строк.
 *
 * Список строк внутри блока в тексте статьи ломается в самом Payload: окно
 * выбора файла пересобирает форму блока из устаревшего снимка, и строка
 * пропадает (payloadcms/payload#15978, #17232). Связи поля с несколькими
 * файлами Payload держит в таблице `*_rels`, колонкой `media_id`.
 *
 * Галерея появилась в той же невыложенной серии, данных в её строках на сайтах
 * нет, поэтому таблицы строк просто убираются.
 *
 * Каждая операция идёт по факту: таблицы блока есть там, где его разрешили
 * ставить, и набор у сайтов разный.
 */

/** Таблицы строк галереи и то, чем они отличаются друг от друга. */
const ROW_TABLES = [
  { table: 'pages_blocks_gallery_items', versioned: false, fileRequired: false },
  { table: '_pages_v_blocks_gallery_items', versioned: true, fileRequired: false },
  { table: 'reusable_blocks_blocks_gallery_items', versioned: false, fileRequired: false },
  { table: '_reusable_blocks_v_blocks_gallery_items', versioned: true, fileRequired: false },
  { table: 'specialists_blocks_gallery_items', versioned: false, fileRequired: true },
] as const;

const RELS_TABLES = [
  'pages_rels',
  '_pages_v_rels',
  'reusable_blocks_rels',
  '_reusable_blocks_v_rels',
  'specialists_rels',
] as const;

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const { table } of ROW_TABLES) {
    if (await hasTable(db, table)) await db.run(sql.raw(`DROP TABLE \`${table}\`;`));
  }
  for (const table of RELS_TABLES) {
    if (!(await hasTable(db, table))) continue;
    await addColumnIfMissing(db, table, 'media_id', 'integer REFERENCES media(id)');
    await db.run(
      sql.raw(
        `CREATE INDEX IF NOT EXISTS \`${table}_media_id_idx\` ON \`${table}\` (\`media_id\`);`,
      ),
    );
  }
}

/**
 * Таблица строк такой, какой её создала миграция `gallery_block`.
 *
 * @remarks
 * У таблиц версий номера строк числовые и есть `_uuid`, у основных - текстовые.
 */
function rowTableSql(table: string, versioned: boolean, fileRequired: boolean): readonly string[] {
  const parent = table.replace(/_items$/, '');
  const id = versioned ? 'integer' : 'text';
  return [
    `CREATE TABLE \`${table}\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` ${id} NOT NULL,
      \`id\` ${id} PRIMARY KEY NOT NULL,
      \`file_id\` integer${fileRequired ? ' NOT NULL' : ''},
      \`caption\` text,${versioned ? '\n      `_uuid` text,' : ''}
      FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`${parent}\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );`,
    `CREATE INDEX \`${table}_order_idx\` ON \`${table}\` (\`_order\`);`,
    `CREATE INDEX \`${table}_parent_id_idx\` ON \`${table}\` (\`_parent_id\`);`,
    `CREATE INDEX \`${table}_file_idx\` ON \`${table}\` (\`file_id\`);`,
  ];
}

/**
 * Откат возвращает таблицы строк, пустыми.
 *
 * Колонка `media_id` в `*_rels` остаётся: SQLite не удаляет колонку с внешним
 * ключом без пересборки таблицы, а пересборка по списку колонок снесла бы связи
 * тех коллекций, которых в списке у этого сайта нет. Пустая колонка никому
 * не мешает.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const { table, versioned, fileRequired } of ROW_TABLES) {
    const parent = table.replace(/_items$/, '');
    if (!(await hasTable(db, parent)) || (await hasTable(db, table))) continue;
    for (const statement of rowTableSql(table, versioned, fileRequired)) {
      await db.run(sql.raw(statement));
    }
  }
}
