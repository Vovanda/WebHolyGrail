'use client';

import { useSyncExternalStore } from 'react';

import type { ModuleKey } from 'contracts';

/**
 * Что меню админки знает раньше сервера: только что переключённые модули
 * и только что переставленные группы.
 *
 * @remarks
 * Меню рисует сервер, и без этого слоя плитка модуля отзывалась в меню через
 * одну-две секунды, после перерисовки. Плитка и перетаскивание пишут сюда,
 * меню читает отсюда поверх серверного снимка. Пришёл новый снимок - отметки
 * модулей сбрасываются, правда снова за сервером. Порядок остаётся: настройка
 * пользователя пишется без ожидания ответа, и снимок, снятый раньше записи,
 * вернул бы меню назад.
 */
interface NavState {
  readonly modules: Readonly<Partial<Record<ModuleKey, boolean>>>;
  readonly order: readonly string[] | null;
}

const EMPTY: NavState = { modules: {}, order: null };

let state: NavState = EMPTY;
const listeners = new Set<() => void>();

function update(next: NavState): void {
  state = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setModuleOn(key: ModuleKey, on: boolean): void {
  update({ ...state, modules: { ...state.modules, [key]: on } });
}

export function setNavOrder(order: readonly string[]): void {
  update({ ...state, order });
}

export function resetModules(): void {
  if (Object.keys(state.modules).length > 0) update({ ...state, modules: {} });
}

export function useNavState(): NavState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => EMPTY,
  );
}
