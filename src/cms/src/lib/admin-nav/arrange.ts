import { moduleOfCollection, type ModuleKey } from 'contracts';

/** Ключ настройки пользователя, где лежит порядок групп меню. */
export const NAV_ORDER_PREFERENCE = 'whg-nav-order';

/**
 * Раскладка меню админки: что видно и в каком порядке.
 *
 * @remarks
 * Payload строит меню из порядка конфига: группы по первому появлению,
 * внутри группы сначала коллекции, потом глобалы. Владелец же расставляет
 * группы сам, а «Настройки сайта» хочет видеть вторыми. Здесь только решение:
 * на вход группы в форме `groupNavItems`, на выход те же группы, переставленные
 * и без разделов выключенных модулей.
 */
export interface NavEntity {
  readonly slug: string;
  readonly type: string;
}

export interface NavGroup<E extends NavEntity = NavEntity> {
  label: string;
  entities: E[];
}

/**
 * Порядок пунктов внутри группы, где порядок конфига не годится.
 *
 * @remarks
 * Глобал Payload ставит после коллекций, и «Настройки сайта» уезжали в конец.
 * В «Доступах» права - основа, коды и ссылки выдаются по ним.
 */
export const ITEM_ORDER: Readonly<Record<string, readonly string[]>> = {
  Настройки: ['users', 'site-settings', 'feature-toggles', 'payload-jobs'],
  Доступы: ['media-access-rights', 'media-accesses', 'media-access-codes', 'media-access-links'],
};

/** Место в списке; чего в списке нет, встаёт после, сохраняя свой порядок. */
function rankBy(list: readonly string[] | undefined) {
  return (value: string): number => {
    const at = list?.indexOf(value) ?? -1;
    return at === -1 ? Number.MAX_SAFE_INTEGER : at;
  };
}

export function arrangeNav<E extends NavEntity>(
  groups: readonly NavGroup<E>[],
  order: readonly string[],
  isOn: (key: ModuleKey) => boolean,
): NavGroup<E>[] {
  const visible = groups
    .map((group) => {
      const itemRank = rankBy(ITEM_ORDER[group.label]);
      const entities = group.entities
        .filter((entity) => {
          const key = entity.type === 'collections' ? moduleOfCollection(entity.slug) : null;
          return key === null || isOn(key);
        })
        .map((entity, index) => ({ entity, index }))
        .sort((a, b) => itemRank(a.entity.slug) - itemRank(b.entity.slug) || a.index - b.index)
        .map(({ entity }) => entity);
      return { ...group, entities };
    })
    .filter((group) => group.entities.length > 0);

  /*
    Сохранённый порядок переставляет только знакомые ему группы, и только между
    местами, которые они занимают. Группа, которой в нём нет (доменная группа
    сайта, новый модуль), стоит где стояла в конфиге: иначе после первого же
    переноса плитки она уезжала бы в конец, и вернуть её было бы нечем.
  */
  const rank = rankBy(order);
  const known = visible.filter((group) => order.includes(group.label));
  const sorted = known
    .map((group, index) => ({ group, index }))
    .sort((a, b) => rank(a.group.label) - rank(b.group.label) || a.index - b.index)
    .map(({ group }) => group);
  let next = 0;
  return visible.map((group) => (order.includes(group.label) ? sorted[next++]! : group));
}
