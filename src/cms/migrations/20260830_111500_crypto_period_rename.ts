// @safe-bluegreen — переименование колонок, значений в них ещё нет ни одного:
// записей, нарезанных криптопериодами, пока не существует.
//
// Прежнее имя пришло от выдуманного термина «зона». Криптопериод - то, как
// этот отрезок называют в стандартах общего шифрования и у поставщиков DRM,
// а смена ключа по ходу - key rotation.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` RENAME COLUMN \`hls_key_step\` TO \`hls_crypto_period\`;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` RENAME COLUMN \`video_key_step\` TO \`video_crypto_period\`;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`media\` RENAME COLUMN \`hls_crypto_period\` TO \`hls_key_step\`;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` RENAME COLUMN \`video_crypto_period\` TO \`video_key_step\`;`,
  );
}
