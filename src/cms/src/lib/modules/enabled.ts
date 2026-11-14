import type { Payload } from 'payload';

import { isModuleEnabled, type ModuleKey } from 'contracts';

import { readToggles } from '../toggles/source';

/**
 * Включён ли модуль - синхронно, по снимку переключателей процесса.
 *
 * @remarks
 * Payload спрашивает о видимости коллекции (`admin.hidden`) синхронно, а
 * переключатели лежат в базе. Поэтому значение берётся из снимка, который
 * обновляется в фоне и сразу после записи переключателя. У двух цветов
 * blue-green снимок свой: второй цвет догоняет за интервал.
 *
 * Пока снимка нет (первые секунды после старта), модуль считается включённым:
 * так ведёт себя сайт без записи переключателя (R10), и спрятать раздел по
 * ошибке чтения хуже, чем показать его лишние секунды.
 */
const REFRESH_MS = 30_000;

let snapshot: Readonly<Record<string, boolean>> = {};
let timer: ReturnType<typeof setInterval> | null = null;

export function moduleOn(key: ModuleKey | null): boolean {
  return isModuleEnabled(snapshot, key);
}

export async function refreshModules(payload: Payload): Promise<void> {
  snapshot = await readToggles(payload, { fresh: true });
}

/** Первый снимок и фоновое обновление; вызывается один раз при запуске. */
export function watchModules(payload: Payload): void {
  void refreshModules(payload).catch(() => undefined);
  if (timer) return;
  timer = setInterval(() => void refreshModules(payload).catch(() => undefined), REFRESH_MS);
  timer.unref?.();
}
