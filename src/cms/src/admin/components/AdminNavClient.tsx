'use client';

import type { NavGroupType } from '@payloadcms/ui/shared';
import type { NavPreferences } from 'payload';
import { useEffect } from 'react';

import { isModuleEnabled, type ModuleKey } from 'contracts';

import { arrangeNav } from '../../lib/admin-nav/arrange';
import { resetModules, useNavState } from '../navState';
import { AdminNavGroups } from './AdminNavGroups';

/**
 * Меню админки в порядке пользователя и с модулями без ожидания сервера.
 *
 * @remarks
 * Сюда приходят все группы, в том числе разделы выключенных модулей, а
 * видимость и порядок решает `arrangeNav`; рисуют их свои группы меню.
 */
export function AdminNavClient({
  groups,
  modules,
  order,
  navPreferences,
}: {
  readonly groups: NavGroupType[];
  readonly modules: Readonly<Record<string, boolean>>;
  readonly order: readonly string[];
  readonly navPreferences: NavPreferences;
}) {
  const local = useNavState();

  // Новый снимок сервера - включённость модулей снова за ним.
  useEffect(() => resetModules(), [modules]);

  const isOn = (key: ModuleKey) => local.modules[key] ?? isModuleEnabled(modules, key);

  return (
    <AdminNavGroups
      groups={arrangeNav(groups, local.order ?? order, isOn)}
      navPreferences={navPreferences}
    />
  );
}
