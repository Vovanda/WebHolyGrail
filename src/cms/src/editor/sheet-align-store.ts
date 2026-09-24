import { useSyncExternalStore } from 'react';

import { otherAlign, readAlign, type SheetAlign } from './sheet-layout';

/**
 * Положение листа у этого зрителя: общее для всех редакторов страницы.
 *
 * @remarks
 * Это удобство одного человека, а не настройка сайта, поэтому живёт в его
 * браузере. Хранилище браузера бывает недоступно - тогда выбор держится до
 * перезагрузки страницы, а лист стоит по центру.
 */

const KEY = 'whg-editor-sheet-align';
const listeners = new Set<() => void>();
let current: SheetAlign | null = null;

function load(): SheetAlign {
  try {
    return readAlign(window.localStorage.getItem(KEY));
  } catch {
    return 'center';
  }
}

function getAlign(): SheetAlign {
  current ??= load();
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function toggleSheetAlign(): void {
  current = otherAlign(getAlign());
  try {
    window.localStorage.setItem(KEY, current);
  } catch {
    // Без хранилища выбор просто не переживёт перезагрузку.
  }
  listeners.forEach((listener) => listener());
}

/** Положение листа; на сервере и до гидрации - по центру. */
export function useSheetAlign(): SheetAlign {
  return useSyncExternalStore(subscribe, getAlign, () => 'center');
}
