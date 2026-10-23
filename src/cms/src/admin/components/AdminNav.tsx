import { NavHamburger, NavWrapper } from '@payloadcms/next/client';
import { DefaultNav } from '@payloadcms/next/rsc';
import { Logout } from '@payloadcms/ui';
import { RenderServerComponent } from '@payloadcms/ui/elements/RenderServerComponent';
import { EntityType, groupNavItems } from '@payloadcms/ui/shared';
import type { NavPreferences, PayloadRequest, ServerProps, SanitizedPermissions } from 'payload';
import { PREFERENCE_KEYS } from 'payload/shared';

import { isModuleEnabled, MODULES, moduleOfCollection, moduleToggleKey } from 'contracts';

import { readToggles } from '../../lib/toggles/source';
import { NAV_ORDER_PREFERENCE } from '../../lib/admin-nav/arrange';
import { AdminNavClient } from './AdminNavClient';
import { ThemeToggle } from './ThemeToggle';

/**
 * Меню админки вместо штатного: те же части Payload, свой порядок и модули.
 *
 * @remarks
 * Повторяет устройство `DefaultNav`. Обёртка и гамбургер - его же `NavWrapper`
 * и `NavHamburger`: экспортированы, но помечены `@internal`, поэтому после
 * подъёма Payload меню проверяется глазами (whg-payload-admin). Слоты
 * `beforeNav`, `afterNav`, `beforeNavLinks`, `afterNavLinks`, кнопка выхода.
 * Рядом с выходом - смена темы: на сайте она там же, в панели.
 * Отличие одно - группы. Сюда добавляются разделы выключенных модулей с правом
 * чтения: включил модуль плиткой - разделы видны сразу, а настоящие права
 * приносит перерисовка, которая идёт следом. Показывать ли их, решает клиент.
 *
 * Включённость читается из базы на каждой отрисовке, а не из снимка процесса:
 * снимок в разработке пустеет при пересборке конфига, и меню показывало
 * выключенное до первой записи переключателя.
 */
async function readPreference<T>(req: PayloadRequest | undefined, key: string): Promise<T | null> {
  if (!req?.user?.collection) return null;
  const found = await req.payload
    .find({
      collection: 'payload-preferences',
      depth: 0,
      limit: 1,
      pagination: false,
      req,
      where: {
        and: [
          { key: { equals: key } },
          { 'user.relationTo': { equals: req.user.collection } },
          { 'user.value': { equals: req.user.id } },
        ],
      },
    })
    .catch(() => null);
  return (found?.docs?.[0]?.value as T | undefined) ?? null;
}

export async function AdminNav(props: ServerProps & { req?: PayloadRequest }) {
  const {
    documentSubViewType,
    i18n,
    locale,
    params,
    payload,
    permissions,
    req,
    searchParams,
    user,
    viewType,
    visibleEntities,
  } = props;
  if (!payload?.config || !visibleEntities) return null;

  const { collections, globals } = payload.config;
  const { afterNav, afterNavLinks, beforeNav, beforeNavLinks, logout, settingsMenu } =
    payload.config.admin.components;

  // Меню настроек рисует кнопка, которой Payload наружу не отдаёт. Сайт, где оно
  // заведено, получает штатное меню целиком, а не наше без его пунктов.
  if (Array.isArray(settingsMenu) && settingsMenu.length > 0) return <DefaultNav {...props} />;

  const toggles = await readToggles(payload, { fresh: true });
  const dormant = collections
    .map((collection) => collection.slug)
    .filter((slug) => {
      const key = moduleOfCollection(slug);
      return key !== null && !isModuleEnabled(toggles, key);
    });

  const shown = new Set([...visibleEntities.collections, ...dormant]);
  const readable = {
    ...permissions,
    collections: {
      ...permissions?.collections,
      ...Object.fromEntries(dormant.map((slug) => [slug, { read: true }])),
    },
  } as SanitizedPermissions;

  const groups = groupNavItems(
    [
      ...collections
        .filter(({ slug }) => shown.has(slug))
        .map((entity) => ({ type: EntityType.collection as const, entity })),
      ...globals
        .filter(({ slug }) => visibleEntities.globals.includes(slug))
        .map((entity) => ({ type: EntityType.global as const, entity })),
    ],
    readable,
    i18n,
  );

  const [navPreferences, order] = await Promise.all([
    readPreference<NavPreferences>(req, PREFERENCE_KEYS.NAV),
    readPreference<string[]>(req, NAV_ORDER_PREFERENCE),
  ]);

  const modules = Object.fromEntries(
    MODULES.map((module) => [moduleToggleKey(module.key), isModuleEnabled(toggles, module.key)]),
  );

  const serverProps = { i18n, locale, params, payload, permissions, searchParams, user };
  const clientProps = { documentSubViewType, viewType };
  type Slot = Parameters<typeof RenderServerComponent>[0]['Component'];
  const slot = (Component: Slot | undefined) =>
    Component
      ? RenderServerComponent({ clientProps, Component, importMap: payload.importMap, serverProps })
      : null;

  return (
    <NavWrapper baseClass="nav">
      {slot(beforeNav)}
      <nav className="nav__wrap">
        {slot(beforeNavLinks)}
        <AdminNavClient
          groups={groups}
          modules={modules}
          order={Array.isArray(order) ? order : []}
          navPreferences={navPreferences ?? { groups: {}, open: true }}
        />
        {slot(afterNavLinks)}
        <div className="nav__controls">
          <ThemeToggle />
          {logout?.Button ? (
            RenderServerComponent({
              clientProps,
              Component: logout.Button,
              Fallback: Logout,
              importMap: payload.importMap,
              serverProps,
            })
          ) : (
            <Logout />
          )}
        </div>
      </nav>
      {slot(afterNav)}
      <div className="nav__header">
        <div className="nav__header-content">
          <NavHamburger baseClass="nav" />
        </div>
      </div>
    </NavWrapper>
  );
}
