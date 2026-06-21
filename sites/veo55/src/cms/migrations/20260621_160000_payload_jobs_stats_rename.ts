import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/**
 * Rename `payload_job_stats` → `payload_jobs_stats` (plural).
 *
 * Опечатка в миграции `20260620_185000_payload_jobs.ts` — Payload Jobs Queue
 * по контракту ожидает таблицу `payload_jobs_stats` (с `s`), а миграция
 * создала `payload_job_stats`. Cron `Error in job queue cron job handler:
 * no such table: payload_jobs_stats` забивает лог раз в минуту.
 *
 * Таблица пуста (Payload только пытался писать stats, ни одной успешной
 * insert не было) — переименование безопасно.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_job_stats\` RENAME TO \`payload_jobs_stats\`;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`payload_jobs_stats\` RENAME TO \`payload_job_stats\`;`);
}
