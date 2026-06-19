import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite';

/**
 * Baseline миграция — закрепляет текущее состояние схемы как стартовую точку
 * для drizzle-snapshot. Файл `.json` рядом содержит полный снимок схемы.
 *
 * `up`/`down` намеренно пустые: на момент перехода с push-режима БД уже
 * содержит все нужные таблицы; повторно создавать их = ошибка «table already
 * exists». Запись в `payload_migrations` добавлена напрямую через SQL (см.
 * `.claude/skills/payload-migration/SKILL.md`, шаг pre-flight).
 *
 * Следующие миграции (`migrate:create <name>`) будут диффить против этого baseline.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {
  // no-op: схема уже создана push-режимом в момент перехода на migrations.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // no-op: baseline не откатываем.
}
