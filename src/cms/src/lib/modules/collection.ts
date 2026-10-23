import type { Access, CollectionConfig } from 'payload';

import { moduleOfCollection, type ModuleKey } from 'contracts';

import { moduleOn } from './enabled';

/**
 * Коллекция модуля слушается его переключателя.
 *
 * @remarks
 * Выключенный модуль прячет коллекцию в меню админки и закрывает её API: REST и
 * GraphQL отвечают отказом. Сценарии самого движка ходят с `overrideAccess` и
 * переключатель не видят - поэтому, например, закрытая запись остаётся закрытой
 * и при выключенном модуле доступов. Таблицы и данные не трогаются: включил
 * модуль - всё на месте.
 *
 * Коллекция без модуля («Контент», «Медиа», служебные) возвращается как есть.
 */
const OPS = ['read', 'create', 'update', 'delete', 'readVersions', 'unlock'] as const;

/** Payload без своего правила пускает вошедшего; так же ведёт себя обёртка. */
const loggedIn: Access = ({ req }) => Boolean(req.user);

export function withModule(collection: CollectionConfig): CollectionConfig {
  const key = moduleOfCollection(collection.slug);
  if (key === null) return collection;

  const access = { ...collection.access };
  for (const op of OPS) {
    const own = (collection.access?.[op] as Access | undefined) ?? loggedIn;
    access[op] = (args) => (moduleOn(key) ? own(args) : false);
  }

  return {
    ...collection,
    access,
    admin: { ...collection.admin, hidden: hiddenWith(collection.admin?.hidden, key) },
  };
}

type Hidden = NonNullable<NonNullable<CollectionConfig['admin']>['hidden']>;

function hiddenWith(own: Hidden | undefined, key: ModuleKey): Hidden {
  return (args) => !moduleOn(key) || (typeof own === 'function' ? own(args) : own === true);
}
