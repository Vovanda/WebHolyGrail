import type { Payload } from 'payload';

import { readEnvToggles } from './env';

/**
 * Признаки из хранилища секретов заводятся в списке админки.
 *
 * @remarks
 * Значение такому признаку задаёт переменная, а не галочка, но в списке он
 * должен быть виден наравне с остальными. Иначе владелец видит поведение сайта
 * и не находит, откуда оно взялось.
 *
 * Заводим один раз при запуске: переменные меняются вместе с перезапуском, и
 * ходить за ними на каждое чтение свода незачем. Значение существующей записи
 * не трогаем - её мог завести владелец, и переписывать чужое поле молча нельзя.
 */
export async function adoptEnvToggles(payload: Payload): Promise<number> {
  const fromEnv = readEnvToggles(process.env);
  const keys = Object.keys(fromEnv);
  if (keys.length === 0) return 0;

  const known = await payload
    .find({
      collection: 'feature-toggles',
      depth: 0,
      limit: 500,
      where: { key: { in: keys } },
      overrideAccess: true,
    })
    .catch(() => null);

  // Список не прочитался - ничего не заводим: повторная попытка будет при
  // следующем запуске, а дубли пришлось бы разбирать руками.
  if (!known) return 0;

  const existing = new Set(known.docs.map((doc) => (doc as { key?: string }).key));
  let added = 0;

  for (const key of keys) {
    if (existing.has(key)) continue;

    const created = await payload
      .create({
        collection: 'feature-toggles',
        data: {
          title: key,
          key,
          source: 'infisical',
          description: 'Значение задаётся переменной окружения, галочки его не меняют.',
        },
        overrideAccess: true,
      })
      .catch(() => null);

    if (created) added += 1;
  }

  return added;
}
