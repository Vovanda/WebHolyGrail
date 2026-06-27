import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_install_snippet\` RENAME TO \`pages_blocks_install_snippet\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_order_idx\` ON \`pages_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_parent_id_idx\` ON \`pages_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_path_idx\` ON \`pages_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_install_snippet\` RENAME TO \`_pages_v_blocks_install_snippet\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_order_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_parent_id_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_path_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_install_snippet\` RENAME TO \`reusable_blocks_blocks_install_snippet\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_order_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_parent_id_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_path_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail --private --clone',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и создавай страницы или пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_install_snippet\` RENAME TO \`_reusable_blocks_v_blocks_install_snippet\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_order_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_parent_id_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_path_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid_items\` ADD \`details\` text;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid_items\` ADD \`details\` text;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid_items\` ADD \`details\` text;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid_items\` ADD \`details\` text;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`);
  await db.run(sql`CREATE TABLE \`__new_pages_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_pages_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`pages_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`pages_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_pages_blocks_install_snippet\` RENAME TO \`pages_blocks_install_snippet\`;`,
  );
  await db.run(sql`PRAGMA foreign_keys=ON;`);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_order_idx\` ON \`pages_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_parent_id_idx\` ON \`pages_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_install_snippet_path_idx\` ON \`pages_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__pages_v_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_pages_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__pages_v_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_pages_v_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`_pages_v_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__pages_v_blocks_install_snippet\` RENAME TO \`_pages_v_blocks_install_snippet\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_order_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_parent_id_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_pages_v_blocks_install_snippet_path_idx\` ON \`_pages_v_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new_reusable_blocks_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`reusable_blocks\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new_reusable_blocks_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "block_name" FROM \`reusable_blocks_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`reusable_blocks_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new_reusable_blocks_blocks_install_snippet\` RENAME TO \`reusable_blocks_blocks_install_snippet\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_order_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_parent_id_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`reusable_blocks_blocks_install_snippet_path_idx\` ON \`reusable_blocks_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`CREATE TABLE \`__new__reusable_blocks_v_blocks_install_snippet\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`_path\` text NOT NULL,
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`command\` text DEFAULT 'gh repo create my-site --template Vovanda/WebHolyGrail',
  	\`caption\` text DEFAULT 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
  	\`visibility_desktop\` integer DEFAULT true,
  	\`visibility_tablet\` integer DEFAULT true,
  	\`visibility_mobile\` integer DEFAULT true,
  	\`_uuid\` text,
  	\`block_name\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`_reusable_blocks_v\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`INSERT INTO \`__new__reusable_blocks_v_blocks_install_snippet\`("_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name") SELECT "_order", "_parent_id", "_path", "id", "command", "caption", "visibility_desktop", "visibility_tablet", "visibility_mobile", "_uuid", "block_name" FROM \`_reusable_blocks_v_blocks_install_snippet\`;`,
  );
  await db.run(sql`DROP TABLE \`_reusable_blocks_v_blocks_install_snippet\`;`);
  await db.run(
    sql`ALTER TABLE \`__new__reusable_blocks_v_blocks_install_snippet\` RENAME TO \`_reusable_blocks_v_blocks_install_snippet\`;`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_order_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_parent_id_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_reusable_blocks_v_blocks_install_snippet_path_idx\` ON \`_reusable_blocks_v_blocks_install_snippet\` (\`_path\`);`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid_items\` DROP COLUMN \`details\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid_items\` DROP COLUMN \`details\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid_items\` DROP COLUMN \`details\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid_items\` DROP COLUMN \`details\`;`,
  );
}
