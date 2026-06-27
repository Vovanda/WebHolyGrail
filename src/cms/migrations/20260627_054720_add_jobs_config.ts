import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite';

// Blank migration — фиксирует добавление jobs config в payload.config.
// Payload Jobs Queue не создаёт DB-tables до первого реального task — пустой
// config (tasks: [], workflows: []) не требует schema changes.

export async function up(_: MigrateUpArgs): Promise<void> {
  // no-op
}

export async function down(_: MigrateDownArgs): Promise<void> {
  // no-op
}
