import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Pedigree (родословная) — добавляет:
 *  - `dogs.rkf_id` integer index — id записи в veorkf.ru, нужен для импорта родословной
 *  - `dogs_pedigree` (+ `_dogs_v_pedigree`) — массив предков 1..14
 *  - `pages_blocks_pedigree` + `_pages_v_blocks_pedigree` — блок «Родословная» в Pages
 *  - `reusable_blocks_blocks_pedigree` + `_reusable_blocks_v_blocks_pedigree` — то же
 *    в ReusableBlocks (блок включён в `REUSABLE_INNER_BLOCKS`)
 *  - visibility-колонки на новых блок-таблицах
 *
 * Создана вручную, drizzle-snapshot не обновлён. Следующая `migrate:create`
 * заметит «новые колонки/таблицы» — отвечать `+ create`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ============================================================
  // dogs.rkf_id + dogs_pedigree (+ _dogs_v_*)
  // ============================================================
  await db.run(sql`ALTER TABLE \`dogs\` ADD \`rkf_id\` integer;`);
  await db.run(sql`CREATE INDEX \`dogs_rkf_id_idx\` ON \`dogs\` (\`rkf_id\`);`);
  await db.run(sql`ALTER TABLE \`_dogs_v\` ADD \`version_rkf_id\` integer;`);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_version_rkf_id_idx\` ON \`_dogs_v\` (\`version_rkf_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`dogs_pedigree\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`position\` integer NOT NULL,
    \`rkf_id\` integer,
    \`name\` text NOT NULL,
    \`note\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(sql`CREATE INDEX \`dogs_pedigree_order_idx\` ON \`dogs_pedigree\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`dogs_pedigree_parent_id_idx\` ON \`dogs_pedigree\` (\`_parent_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_dogs_v_pedigree\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`position\` integer NOT NULL,
    \`rkf_id\` integer,
    \`name\` text NOT NULL,
    \`note\` text,
    \`_uuid\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_dogs_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`_dogs_v_pedigree_order_idx\` ON \`_dogs_v_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_dogs_v_pedigree_parent_id_idx\` ON \`_dogs_v_pedigree\` (\`_parent_id\`);`,
  );

  // ============================================================
  // pages_blocks_pedigree (+ _pages_v_)
  // ============================================================
  await db.run(sql`CREATE TABLE \`pages_blocks_pedigree\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`dog_id\` integer,
    \`title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`dog_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_pedigree_order_idx\` ON \`pages_blocks_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_pedigree_parent_id_idx\` ON \`pages_blocks_pedigree\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_pedigree_path_idx\` ON \`pages_blocks_pedigree\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_pedigree_dog_idx\` ON \`pages_blocks_pedigree\` (\`dog_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_pages_v_blocks_pedigree\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`dog_id\` integer,
    \`title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`_uuid\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`dog_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`);
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_pedigree_order_idx\` ON \`_pages_v_blocks_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_pedigree_parent_id_idx\` ON \`_pages_v_blocks_pedigree\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_pedigree_path_idx\` ON \`_pages_v_blocks_pedigree\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_pedigree_dog_idx\` ON \`_pages_v_blocks_pedigree\` (\`dog_id\`);`,
  );

  // ============================================================
  // reusable_blocks_blocks_pedigree (+ _reusable_blocks_v_)
  // ============================================================
  await db.run(sql`CREATE TABLE \`reusable_blocks_blocks_pedigree\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`dog_id\` integer,
    \`title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`dog_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`);
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_pedigree_order_idx\` ON \`reusable_blocks_blocks_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_pedigree_parent_id_idx\` ON \`reusable_blocks_blocks_pedigree\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_pedigree_path_idx\` ON \`reusable_blocks_blocks_pedigree\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_pedigree_dog_idx\` ON \`reusable_blocks_blocks_pedigree\` (\`dog_id\`);`,
  );

  await db.run(sql`CREATE TABLE \`_reusable_blocks_v_blocks_pedigree\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`_path\` text NOT NULL,
    \`id\` integer PRIMARY KEY NOT NULL,
    \`dog_id\` integer,
    \`title\` text,
    \`visibility_desktop\` integer DEFAULT true,
    \`visibility_tablet\` integer DEFAULT true,
    \`visibility_mobile\` integer DEFAULT true,
    \`_uuid\` text,
    \`block_name\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`dog_id\`) REFERENCES \`dogs\`(\`id\`) ON UPDATE no action ON DELETE set null
  );`);
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_pedigree_order_idx\` ON \`_reusable_blocks_v_blocks_pedigree\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_pedigree_parent_id_idx\` ON \`_reusable_blocks_v_blocks_pedigree\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_pedigree_path_idx\` ON \`_reusable_blocks_v_blocks_pedigree\` (\`_path\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_pedigree_dog_idx\` ON \`_reusable_blocks_v_blocks_pedigree\` (\`dog_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_pedigree\`;`);
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_pedigree\`;`);
  await db.run(sql`DROP TABLE \`_pages_v_blocks_pedigree\`;`);
  await db.run(sql`DROP TABLE \`pages_blocks_pedigree\`;`);
  await db.run(sql`DROP TABLE \`_dogs_v_pedigree\`;`);
  await db.run(sql`DROP TABLE \`dogs_pedigree\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`_dogs_v_version_rkf_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`_dogs_v\` DROP COLUMN \`version_rkf_id\`;`);
  await db.run(sql`DROP INDEX IF EXISTS \`dogs_rkf_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`dogs\` DROP COLUMN \`rkf_id\`;`);
}
