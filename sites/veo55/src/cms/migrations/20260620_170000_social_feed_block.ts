import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * SocialFeed блок — таблицы для Pages.blocks + ReusableBlocks.content + версии.
 * Поле `sources[]` — `select hasMany` → отдельная таблица `*_sources`
 * (Payload pattern для multi-select).
 *
 * Создана вручную, drizzle-snapshot не обновлён.
 */
function tableSql(table: string, parent: 'pages' | 'reusable_blocks', isVersion: boolean): string {
  const idType = isVersion ? 'integer' : 'text';
  const parentTable = isVersion ? `_${parent}_v` : parent;
  return `CREATE TABLE \`${table}\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` ${idType} PRIMARY KEY ${isVersion ? '' : 'NOT NULL'},
    \`count\` integer DEFAULT 30,
    \`hide_latest\` integer DEFAULT 2,
    \`show_filters\` integer DEFAULT true,
    \`week_top_n\` integer DEFAULT 3,
    \`month_top_n\` integer DEFAULT 10,
    \`hide_tag_regex\` text DEFAULT '#эксклюз',
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    ${isVersion ? '`_uuid` text,' : ''}
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`${parentTable}\`(\`id\`) ON UPDATE no action ON DELETE cascade
  )`;
}

function indexes(table: string): string[] {
  return [
    `CREATE INDEX \`${table}_order_idx\` ON \`${table}\` (\`_order\`)`,
    `CREATE INDEX \`${table}_parent_id_idx\` ON \`${table}\` (\`_parent_id\`)`,
    `CREATE INDEX \`${table}_path_idx\` ON \`${table}\` (\`_path\`)`,
  ];
}

function sourcesTableSql(parentBlockTable: string, isVersion: boolean): string {
  const childId = isVersion ? 'integer' : 'text';
  const parentId = isVersion ? 'integer' : 'text';
  return `CREATE TABLE \`${parentBlockTable}_sources\` (
    \`order\` integer NOT NULL,
    \`parent_id\` ${parentId} NOT NULL,
    \`value\` text,
    \`id\` ${childId} PRIMARY KEY ${isVersion ? '' : 'NOT NULL'},
    FOREIGN KEY (\`parent_id\`) REFERENCES \`${parentBlockTable}\`(\`id\`) ON UPDATE no action ON DELETE cascade
  )`;
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const variants: Array<{
    table: string;
    parent: 'pages' | 'reusable_blocks';
    isVersion: boolean;
  }> = [
    { table: 'pages_blocks_social_feed', parent: 'pages', isVersion: false },
    { table: '_pages_v_blocks_social_feed', parent: 'pages', isVersion: true },
    { table: 'reusable_blocks_blocks_social_feed', parent: 'reusable_blocks', isVersion: false },
    { table: '_reusable_blocks_v_blocks_social_feed', parent: 'reusable_blocks', isVersion: true },
  ];

  for (const v of variants) {
    await db.run(sql.raw(tableSql(v.table, v.parent, v.isVersion) + ';'));
    for (const idx of indexes(v.table)) {
      await db.run(sql.raw(idx + ';'));
    }
    await db.run(sql.raw(sourcesTableSql(v.table, v.isVersion) + ';'));
    await db.run(
      sql.raw(
        `CREATE INDEX \`${v.table}_sources_order_idx\` ON \`${v.table}_sources\` (\`order\`);`,
      ),
    );
    await db.run(
      sql.raw(
        `CREATE INDEX \`${v.table}_sources_parent_id_idx\` ON \`${v.table}_sources\` (\`parent_id\`);`,
      ),
    );
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const t of [
    '_reusable_blocks_v_blocks_social_feed_sources',
    '_reusable_blocks_v_blocks_social_feed',
    'reusable_blocks_blocks_social_feed_sources',
    'reusable_blocks_blocks_social_feed',
    '_pages_v_blocks_social_feed_sources',
    '_pages_v_blocks_social_feed',
    'pages_blocks_social_feed_sources',
    'pages_blocks_social_feed',
  ]) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS \`${t}\`;`));
  }
}
