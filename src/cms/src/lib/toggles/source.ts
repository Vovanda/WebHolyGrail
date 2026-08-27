import type { Payload } from 'payload';

import { currentEnvironment, decideAll, type ToggleRecord } from './decide';
import { readEnvToggles } from './env';

/**
 * Откуда берутся значения переключателей.
 *
 * @remarks
 * Источников два: таблица в базе, где признаки заводит владелец, и переменные
 * окружения, которые приходят из хранилища секретов. Пришедшее снаружи главнее
 * галочек: если признаком управляет тот, кто занимается серверами, галочка не
 * должна тихо его переопределять.
 *
 * Внешний узел настроек появится, когда сайтов станет несколько: тогда меняется
 * только эта прослойка, а сайт и админка остаются как есть.
 *
 * Свод держим недолго в памяти: сайт спрашивает его на каждой странице, и
 * ходить в базу каждый раз незачем. Задержка в полминуты для переключателя
 * незаметна - это не то, что меняют ежесекундно.
 */

/** Сколько свод считается свежим. */
const FRESH_MS = 30_000;

let cached: { at: number; value: Record<string, boolean> } | null = null;

export interface ToggleSourceOptions {
  /** Пересобрать свод, не дожидаясь устаревания: после правки в админке. */
  readonly fresh?: boolean;
  readonly now?: Date;
}

/** Что включено прямо сейчас: признак и да или нет. */
export async function readToggles(
  payload: Payload,
  options: ToggleSourceOptions = {},
): Promise<Record<string, boolean>> {
  const now = options.now ?? new Date();

  if (!options.fresh && cached && now.getTime() - cached.at < FRESH_MS) {
    return cached.value;
  }

  const found = await payload
    .find({ collection: 'feature-toggles', depth: 0, limit: 200, overrideAccess: true })
    .catch(() => null);

  // База не ответила - отдаём прошлый свод, а если его нет, считаем всё
  // выключенным. Молча включать возможности при сбое нельзя.
  if (!found) return cached?.value ?? {};

  const records = found.docs as ReadonlyArray<ToggleRecord>;
  const value = {
    ...decideAll(records, {
      environment: currentEnvironment(process.env['APP_ENVIRONMENT'] ?? process.env['NODE_ENV']),
      now,
    }),
    ...readEnvToggles(process.env),
  };

  cached = { at: now.getTime(), value };
  return value;
}

/** Забыть свод: вызывается после правки, чтобы новое значение ушло сразу. */
export function forgetToggles(): void {
  cached = null;
}
