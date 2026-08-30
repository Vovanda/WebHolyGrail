// Модель доступа: четыре сущности вместо трёх разрозненных связей.
//
// Одна миграция на весь эпик. Прежде их было одиннадцать: поле добавляли, через
// час переименовывали, ещё через час убирали. На прод не уходила ни одна, поэтому
// история этих шагов никому не нужна - остаётся итог.
//
// Доступ держит состав и дату отсечки, а право, код и ссылка ведут к нему. Отсечка
// на сегодня закрывает материал у всех держателей сразу, права при этом целы.
//
// Перенос: на каждый материал, к которому вело хоть одно право или код, заводится
// доступ; ссылки на материал заменяются ссылками на него. Выданное прежде
// продолжает открывать.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`CREATE TABLE \`key_usage\` ( \`id\` integer PRIMARY KEY NOT NULL, \`viewer\` text NOT NULL, \`left\` numeric NOT NULL, \`at\` numeric NOT NULL, \`seen\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL );`,
  );
  await db.run(sql`CREATE INDEX \`key_usage_created_at_idx\` ON \`key_usage\` (\`created_at\`);`);
  await db.run(sql`CREATE INDEX \`key_usage_updated_at_idx\` ON \`key_usage\` (\`updated_at\`);`);
  await db.run(sql`CREATE UNIQUE INDEX \`key_usage_viewer_idx\` ON \`key_usage\` (\`viewer\`);`);
  await db.run(
    sql`CREATE TABLE \`media_accesses\` ( \`id\` integer PRIMARY KEY NOT NULL, \`title\` text NOT NULL, \`owner_id\` integer, \`cutoff\` text, \`note\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (\`owner_id\`) REFERENCES \`authors\`(\`id\`) ON UPDATE no action ON DELETE set null );`,
  );
  await db.run(
    sql`CREATE INDEX \`media_accesses_owner_idx\` ON \`media_accesses\` (\`owner_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_accesses_updated_at_idx\` ON \`media_accesses\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE TABLE \`media_accesses_rels\` ( \`id\` integer PRIMARY KEY NOT NULL, \`order\` integer, \`parent_id\` integer NOT NULL, \`path\` text NOT NULL, \`playlists_id\` integer, \`media_id\` integer, FOREIGN KEY (\`parent_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE cascade, FOREIGN KEY (\`playlists_id\`) REFERENCES \`playlists\`(\`id\`) ON UPDATE no action ON DELETE cascade, FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade );`,
  );
  await db.run(
    sql`CREATE INDEX \`media_accesses_rels_parent_idx\` ON \`media_accesses_rels\` (\`parent_id\`);`,
  );
  await db.run(
    sql`CREATE TABLE \`media_access_rights\` ( \`id\` integer PRIMARY KEY NOT NULL, \`viewer_id\` integer, \`phone\` text, \`email\` text, \`visitor_marker\` text, \`access_id\` integer NOT NULL, \`source\` text DEFAULT 'manual', \`expires_at\` text, \`max_views\` numeric, \`views\` numeric DEFAULT 0, \`note\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (\`viewer_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null, FOREIGN KEY (\`access_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE cascade );`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_rights_access_idx\` ON \`media_access_rights\` (\`access_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_rights_marker_idx\` ON \`media_access_rights\` (\`visitor_marker\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_rights_updated_at_idx\` ON \`media_access_rights\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_rights_viewer_idx\` ON \`media_access_rights\` (\`viewer_id\`);`,
  );
  await db.run(
    sql`CREATE TABLE \`media_access_codes\` ( \`id\` integer PRIMARY KEY NOT NULL, \`code\` text, \`access_id\` integer, \`label\` text, \`revoked\` integer DEFAULT false, \`max_uses\` numeric, \`used_count\` numeric DEFAULT 0, \`expires_at\` text, \`grant_days\` numeric, \`grant_minutes\` numeric, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (\`access_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE cascade );`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_codes_access_idx\` ON \`media_access_codes\` (\`access_id\`);`,
  );
  await db.run(
    sql`CREATE UNIQUE INDEX \`media_access_codes_code_idx\` ON \`media_access_codes\` (\`code\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_codes_updated_at_idx\` ON \`media_access_codes\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE TABLE \`media_access_links\` ( \`id\` integer PRIMARY KEY NOT NULL, \`label\` text, \`token\` text, \`access_id\` integer NOT NULL, \`revoked\` integer DEFAULT false, \`expires_at\` text NOT NULL, \`max_uses\` numeric, \`used_count\` numeric DEFAULT 0, \`grant_days\` numeric, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (\`access_id\`) REFERENCES \`media_accesses\`(\`id\`) ON UPDATE no action ON DELETE cascade );`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_links_access_idx\` ON \`media_access_links\` (\`access_id\`);`,
  );
  await db.run(
    sql`CREATE UNIQUE INDEX \`media_access_links_token_idx\` ON \`media_access_links\` (\`token\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_access_links_updated_at_idx\` ON \`media_access_links\` (\`updated_at\`);`,
  );
  await db.run(sql`ALTER TABLE \`media\` ADD \`hls_crypto_period\` numeric;`);
  await db.run(sql`ALTER TABLE \`media\` ADD \`description\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`video_crypto_period\` numeric;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` ADD \`show_title\` integer DEFAULT true;`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`show_title\` integer DEFAULT true;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`media_accesses_id\` integer REFERENCES media_accesses(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`media_access_rights_id\` integer REFERENCES media_access_rights(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`media_access_codes_id\` integer REFERENCES media_access_codes(id);`,
  );
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`media_access_links_id\` integer REFERENCES media_access_links(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_codes_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_codes_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_links_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_links_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_access_rights_id_idx\` ON \`payload_locked_documents_rels\` (\`media_access_rights_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_media_accesses_id_idx\` ON \`payload_locked_documents_rels\` (\`media_accesses_id\`);`,
  );
  await db.run(
    sql`INSERT INTO \`media_accesses\` (\`title\`) SELECT DISTINCT COALESCE(p.\`title\`, m.\`filename\`, 'Доступ') FROM (SELECT \`playlists_id\`, \`media_id\` FROM \`entitlements_rels\` WHERE \`path\` = 'resource' UNION SELECT \`playlist_id\` AS \`playlists_id\`, NULL AS \`media_id\` FROM \`access_codes\`) AS src LEFT JOIN \`playlists\` p ON p.\`id\` = src.\`playlists_id\` LEFT JOIN \`media\` m ON m.\`id\` = src.\`media_id\`;`,
  );
  await db.run(
    sql`INSERT INTO \`media_accesses_rels\` (\`parent_id\`, \`path\`, \`playlists_id\`) SELECT a.\`id\`, 'playlists', p.\`id\` FROM \`media_accesses\` a JOIN \`playlists\` p ON p.\`title\` = a.\`title\`;`,
  );
  await db.run(
    sql`INSERT INTO \`media_accesses_rels\` (\`parent_id\`, \`path\`, \`media_id\`) SELECT a.\`id\`, 'videos', m.\`id\` FROM \`media_accesses\` a JOIN \`media\` m ON m.\`filename\` = a.\`title\`;`,
  );
  await db.run(
    sql`INSERT INTO \`media_access_rights\` (\`id\`, \`viewer_id\`, \`phone\`, \`email\`, \`visitor_marker\`, \`access_id\`, \`source\`, \`expires_at\`, \`note\`, \`updated_at\`, \`created_at\`) SELECT e.\`id\`, e.\`viewer_id\`, e.\`phone\`, e.\`email\`, NULL, r.\`parent_id\`, e.\`source\`, e.\`expires_at\`, e.\`note\`, e.\`updated_at\`, e.\`created_at\` FROM \`entitlements\` e JOIN \`entitlements_rels\` er ON er.\`parent_id\` = e.\`id\` AND er.\`path\` = 'resource' JOIN \`media_accesses_rels\` r ON (r.\`playlists_id\` IS NOT NULL AND r.\`playlists_id\` = er.\`playlists_id\`) OR (r.\`media_id\` IS NOT NULL AND r.\`media_id\` = er.\`media_id\`);`,
  );
  await db.run(
    sql`INSERT INTO \`media_access_codes\` (\`id\`, \`code\`, \`access_id\`, \`max_uses\`, \`used_count\`, \`expires_at\`, \`grant_days\`, \`updated_at\`, \`created_at\`) SELECT c.\`id\`, c.\`code\`, r.\`parent_id\`, c.\`max_uses\`, c.\`used_count\`, c.\`expires_at\`, c.\`grant_days\`, c.\`updated_at\`, c.\`created_at\` FROM \`access_codes\` c LEFT JOIN \`media_accesses_rels\` r ON r.\`playlists_id\` IS NOT NULL AND r.\`playlists_id\` = c.\`playlist_id\`;`,
  );
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_entitlements_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`entitlements_id\`;`);
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_access_codes_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`access_codes_id\`;`);
  await db.run(sql`DROP TABLE \`entitlements_rels\`;`);
  await db.run(sql`DROP TABLE \`entitlements\`;`);
  await db.run(sql`DROP TABLE \`access_codes\`;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  /*
    Обратно - к связям на материал, как было до эпика. Сами доступы теряются:
    в прежней схеме такой сущности нет, и разложить их обратно не во что.
    Права и коды возвращаются к тем подборкам и записям, которые доступ покрывал.
  */
  await db.run(
    sql`CREATE TABLE \`entitlements\` ( \`id\` integer PRIMARY KEY NOT NULL, \`viewer_id\` integer, \`phone\` text, \`email\` text, \`source\` text DEFAULT 'manual', \`expires_at\` text, \`note\` text, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, FOREIGN KEY (\`viewer_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null );`,
  );
  await db.run(
    sql`CREATE TABLE \`entitlements_rels\` ( \`id\` integer PRIMARY KEY NOT NULL, \`order\` integer, \`parent_id\` integer NOT NULL, \`path\` text NOT NULL, \`playlists_id\` integer, \`media_id\` integer, FOREIGN KEY (\`parent_id\`) REFERENCES \`entitlements\`(\`id\`) ON UPDATE no action ON DELETE cascade );`,
  );
  await db.run(
    sql`CREATE TABLE \`access_codes\` ( \`id\` integer PRIMARY KEY NOT NULL, \`code\` text, \`playlist_id\` integer, \`requires_sign_in\` integer DEFAULT true, \`max_uses\` numeric, \`used_count\` numeric DEFAULT 0, \`expires_at\` text, \`grant_days\` numeric, \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL, \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL );`,
  );
  await db.run(
    sql`INSERT INTO \`entitlements\` (\`id\`, \`viewer_id\`, \`phone\`, \`email\`, \`source\`, \`expires_at\`, \`note\`, \`updated_at\`, \`created_at\`) SELECT \`id\`, \`viewer_id\`, \`phone\`, \`email\`, \`source\`, \`expires_at\`, \`note\`, \`updated_at\`, \`created_at\` FROM \`media_access_rights\`;`,
  );
  await db.run(
    sql`INSERT INTO \`entitlements_rels\` (\`parent_id\`, \`path\`, \`playlists_id\`, \`media_id\`) SELECT g.\`id\`, 'resource', r.\`playlists_id\`, r.\`media_id\` FROM \`media_access_rights\` g JOIN \`media_accesses_rels\` r ON r.\`parent_id\` = g.\`access_id\`;`,
  );
  await db.run(
    sql`INSERT INTO \`access_codes\` (\`id\`, \`code\`, \`playlist_id\`, \`max_uses\`, \`used_count\`, \`expires_at\`, \`grant_days\`, \`updated_at\`, \`created_at\`) SELECT c.\`id\`, c.\`code\`, r.\`playlists_id\`, c.\`max_uses\`, c.\`used_count\`, c.\`expires_at\`, c.\`grant_days\`, c.\`updated_at\`, c.\`created_at\` FROM \`media_access_codes\` c LEFT JOIN \`media_accesses_rels\` r ON r.\`parent_id\` = c.\`access_id\` AND r.\`playlists_id\` IS NOT NULL;`,
  );
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`entitlements_id\` integer;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`access_codes_id\` integer;`);
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_media_accesses_id_idx\`;`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`media_accesses_id\`;`,
  );
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_media_access_rights_id_idx\`;`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`media_access_rights_id\`;`,
  );
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_media_access_codes_id_idx\`;`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`media_access_codes_id\`;`,
  );
  await db.run(sql`DROP INDEX \`payload_locked_documents_rels_media_access_links_id_idx\`;`);
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`media_access_links_id\`;`,
  );
  await db.run(sql`DROP TABLE \`media_access_links\`;`);
  await db.run(sql`DROP TABLE \`media_access_codes\`;`);
  await db.run(sql`DROP TABLE \`media_access_rights\`;`);
  await db.run(sql`DROP TABLE \`media_accesses_rels\`;`);
  await db.run(sql`DROP TABLE \`media_accesses\`;`);
  await db.run(sql`DROP TABLE \`key_usage\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`show_description\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`show_description\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`show_description\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`show_title\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`show_description\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`show_description\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`hls_crypto_period\`;`);
  await db.run(sql`ALTER TABLE \`media\` DROP COLUMN \`description\`;`);
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`video_crypto_period\`;`);
}
