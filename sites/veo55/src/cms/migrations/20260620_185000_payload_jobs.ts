import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

/**
 * payload-jobs — встроенная Payload-коллекция (Jobs Queue API).
 *
 * Содержит `payload_jobs` (главная) + `payload_jobs_log` (array log записей
 * с состоянием отдельных task внутри workflow). Используется автоматически
 * Payload при `payload.jobs.queue(...)` / `payload.jobs.run(...)` и при
 * scheduling (cron) — встаёт в очередь и выполняется runner'ом.
 *
 * Также:
 *  - `payload_jobs_log` для подробного task-log внутри jobs
 *  - `payload_job_stats` (single-row global) для статистики scheduling
 *  - `payload_locked_documents_rels.payload_jobs_id` — locking polymorphic
 *
 * Поля взяты из `node_modules/payload/dist/queues/config/collection.js`.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── payload_jobs ───────────────────────────────────────────
  await db.run(sql`CREATE TABLE \`payload_jobs\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`input\` text,
    \`completed_at\` text,
    \`total_tried\` integer DEFAULT 0,
    \`has_error\` integer DEFAULT false,
    \`error\` text,
    \`task_slug\` text,
    \`queue\` text DEFAULT 'default',
    \`wait_until\` text,
    \`processing\` integer DEFAULT false,
    \`meta\` text,
    \`updated_at\` text NOT NULL,
    \`created_at\` text NOT NULL
  );`);
  await db.run(sql`CREATE INDEX \`payload_jobs_queue_idx\` ON \`payload_jobs\` (\`queue\`);`);
  await db.run(
    sql`CREATE INDEX \`payload_jobs_wait_until_idx\` ON \`payload_jobs\` (\`wait_until\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_processing_idx\` ON \`payload_jobs\` (\`processing\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_has_error_idx\` ON \`payload_jobs\` (\`has_error\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_task_slug_idx\` ON \`payload_jobs\` (\`task_slug\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_updated_at_idx\` ON \`payload_jobs\` (\`updated_at\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_created_at_idx\` ON \`payload_jobs\` (\`created_at\`);`,
  );

  // ── payload_jobs_log (array записей по каждой task внутри job) ─
  await db.run(sql`CREATE TABLE \`payload_jobs_log\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`executed_at\` text,
    \`completed_at\` text,
    \`task_slug\` text,
    \`task_id\` text,
    \`input\` text,
    \`output\` text,
    \`state\` text,
    \`error\` text,
    \`parent_task_slug\` text,
    \`parent_task_id\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`payload_jobs\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`);
  await db.run(
    sql`CREATE INDEX \`payload_jobs_log_order_idx\` ON \`payload_jobs_log\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_jobs_log_parent_id_idx\` ON \`payload_jobs_log\` (\`_parent_id\`);`,
  );

  // ── payload_job_stats (single-row global для scheduling) ────
  await db.run(sql`CREATE TABLE \`payload_job_stats\` (
    \`id\` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    \`stats\` text,
    \`updated_at\` text,
    \`created_at\` text
  );`);

  // ── locked-documents-rels polymorphic FK ─────────────────────
  await db.run(
    sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`payload_jobs_id\` integer REFERENCES payload_jobs(id);`,
  );
  await db.run(
    sql`CREATE INDEX \`payload_locked_documents_rels_payload_jobs_id_idx\` ON \`payload_locked_documents_rels\` (\`payload_jobs_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP INDEX IF EXISTS \`payload_locked_documents_rels_payload_jobs_id_idx\`;`);
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` DROP COLUMN \`payload_jobs_id\`;`);
  await db.run(sql`DROP TABLE \`payload_job_stats\`;`);
  await db.run(sql`DROP TABLE \`payload_jobs_log\`;`);
  await db.run(sql`DROP TABLE \`payload_jobs\`;`);
}
