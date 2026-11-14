import type { Payload } from 'payload';

import { MODULES, moduleToggleKey } from 'contracts';

/**
 * Выключает у нового сайта модули, которые ему с порога не нужны.
 *
 * @remarks
 * Переключатели модулей к этому моменту уже заведены включёнными: их заводит
 * запуск CMS (`adoptSystemToggles`), и живой сайт так ничего не теряет (R10).
 * Стартовое наполнение гоняется на каждой выкладке, поэтому выключает только
 * у нового сайта (база была пустой до наполнения) и только модуль без единой
 * записи: выбор владельца и его данные не трогаются.
 *
 * Возвращает ключи выключенных модулей.
 */
export async function startModulesOff(payload: Payload, isNewSite: boolean): Promise<string[]> {
  if (!isNewSite) return [];

  const off: string[] = [];

  for (const module of MODULES) {
    if (module.onNewSite) continue;

    const counts = await Promise.all(
      module.collections.map((collection) =>
        payload.count({ collection, overrideAccess: true }).then((r) => r.totalDocs),
      ),
    );
    if (counts.some((n) => n > 0)) continue;

    const updated = await payload.update({
      collection: 'feature-toggles',
      where: { key: { equals: moduleToggleKey(module.key) } },
      data: { production: false, staging: false, development: false },
      overrideAccess: true,
    });
    if (updated.docs.length > 0) off.push(module.key);
  }

  return off;
}
