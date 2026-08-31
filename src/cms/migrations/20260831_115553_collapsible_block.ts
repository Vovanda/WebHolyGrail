// @safe-bluegreen - только новые таблицы под блок, старый цвет их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Выполняет шаг, пропуская невозможное и уже сделанное.
 *
 * @remarks
 * Таблицы блока заводятся по одной на каждого хозяина - страницы, общие секции,
 * специалисты. Набор хозяев у сайта свой: коллекции специалистов может не быть
 * вовсе, и тогда прямое создание падает на отсутствующей ссылке, унося с собой
 * выкладку.
 *
 * Пропускаются ровно два случая - таблица уже есть и создавать не на чем.
 * Остальные ошибки летят дальше.
 */
async function step(run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    if (!/already exists|no such table/i.test(text)) throw error;
  }
}

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await step(() =>
    db.run(sql`CREATE TABLE \`pages_blocks_collapsible\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`open_by_default\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`pages_blocks_collapsible_order_idx\` ON \`pages_blocks_collapsible\` (\`_order\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`pages_blocks_collapsible_parent_id_idx\` ON \`pages_blocks_collapsible\` (\`_parent_id\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`pages_blocks_collapsible_path_idx\` ON \`pages_blocks_collapsible\` (\`_path\`);`,
    ),
  );
  await step(() =>
    db.run(sql`CREATE TABLE \`_pages_v_blocks_collapsible\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`open_by_default\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`_pages_v_blocks_collapsible_order_idx\` ON \`_pages_v_blocks_collapsible\` (\`_order\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`_pages_v_blocks_collapsible_parent_id_idx\` ON \`_pages_v_blocks_collapsible\` (\`_parent_id\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`_pages_v_blocks_collapsible_path_idx\` ON \`_pages_v_blocks_collapsible\` (\`_path\`);`,
    ),
  );
  await step(() =>
    db.run(sql`CREATE TABLE \`reusable_blocks_blocks_collapsible\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`open_by_default\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`reusable_blocks_blocks_collapsible_order_idx\` ON \`reusable_blocks_blocks_collapsible\` (\`_order\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`reusable_blocks_blocks_collapsible_parent_id_idx\` ON \`reusable_blocks_blocks_collapsible\` (\`_parent_id\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`reusable_blocks_blocks_collapsible_path_idx\` ON \`reusable_blocks_blocks_collapsible\` (\`_path\`);`,
    ),
  );
  await step(() =>
    db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_collapsible\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`title\` text,
  	\`body\` text,
  	\`open_by_default\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`_reusable_blocks_v_blocks_collapsible_order_idx\` ON \`_reusable_blocks_v_blocks_collapsible\` (\`_order\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`_reusable_blocks_v_blocks_collapsible_parent_id_idx\` ON \`_reusable_blocks_v_blocks_collapsible\` (\`_parent_id\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`_reusable_blocks_v_blocks_collapsible_path_idx\` ON \`_reusable_blocks_v_blocks_collapsible\` (\`_path\`);`,
    ),
  );
  await step(() =>
    db.run(sql`CREATE TABLE \`specialists_blocks_collapsible\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`title\` text NOT NULL,
  	\`body\` text NOT NULL,
  	\`open_by_default\` integer DEFAULT false,
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`appearance_css\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`specialists\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`specialists_blocks_collapsible_order_idx\` ON \`specialists_blocks_collapsible\` (\`_order\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`specialists_blocks_collapsible_parent_id_idx\` ON \`specialists_blocks_collapsible\` (\`_parent_id\`);`,
    ),
  );
  await step(() =>
    db.run(
      sql`CREATE INDEX \`specialists_blocks_collapsible_path_idx\` ON \`specialists_blocks_collapsible\` (\`_path\`);`,
    ),
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await step(() => db.run(sql`DROP TABLE \`pages_blocks_collapsible\`;`));
  await step(() => db.run(sql`DROP TABLE \`_pages_v_blocks_collapsible\`;`));
  await step(() => db.run(sql`DROP TABLE \`reusable_blocks_blocks_collapsible\`;`));
  await step(() => db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_collapsible\`;`));
  await step(() => db.run(sql`DROP TABLE \`specialists_blocks_collapsible\`;`));
}
