import type { Payload } from 'payload';

/**
 * Переключатели, которые знает сам движок.
 *
 * @remarks
 * Ветвление живёт в коде и приезжает обновлением всем сайтам, а сам
 * переключатель - запись в базе, и база у каждого сайта своя. Пока запись не
 * заведена, владелец видит поведение, но переключить его нечем: в списке
 * админки пусто. Так вышло с выбором плеера - на двух сайтах он был, на двух
 * других нет вовсе.
 *
 * Поэтому перечень лежит рядом с тем, кто эти признаки читает, и недостающие
 * заводятся при запуске. Значение уже заведённой записи не трогается: его
 * выбрал владелец.
 *
 * Добавляя сюда признак, пишите подпись словами: этот текст владелец увидит
 * в списке, и по нему решает, что переключает.
 */
export interface SystemToggle {
  readonly key: string;
  readonly title: string;
  readonly description: string;
  /** Каким он должен быть у сайта, где о нём ещё не думали. */
  readonly enabled: boolean;
}

export const SYSTEM_TOGGLES: readonly SystemToggle[] = [
  {
    key: 'video.layout.vendor',
    title: 'Плеер: сторонний вид',
    description:
      'Выключен - запись играет в нашем плеере: панель, оглавление и код доступа собраны нами. Включён - берётся вид библиотеки. Переключается в любой момент, перекодировать записи не нужно.',
    enabled: false,
  },
];

/**
 * Заводит недостающие переключатели движка.
 *
 * @remarks
 * Возвращает, сколько записей появилось. Ошибку чтения списка не считаем
 * поводом что-то создавать: повторная попытка будет при следующем запуске,
 * а дубли пришлось бы разбирать руками.
 */
export async function adoptSystemToggles(payload: Payload): Promise<number> {
  const ключи = SYSTEM_TOGGLES.map((t) => t.key);
  if (ключи.length === 0) return 0;

  const известные = await payload
    .find({
      collection: 'feature-toggles',
      depth: 0,
      limit: 500,
      where: { key: { in: ключи } },
      overrideAccess: true,
    })
    .catch(() => null);

  if (!известные) return 0;

  const есть = new Set(известные.docs.map((doc) => (doc as { key?: string }).key));
  let заведено = 0;

  for (const признак of SYSTEM_TOGGLES) {
    if (есть.has(признак.key)) continue;

    const создан = await payload
      .create({
        collection: 'feature-toggles',
        data: {
          title: признак.title,
          key: признак.key,
          description: признак.description,
          production: признак.enabled,
          staging: признак.enabled,
          development: признак.enabled,
        },
        overrideAccess: true,
      })
      .catch(() => null);

    if (создан) заведено += 1;
  }

  return заведено;
}
