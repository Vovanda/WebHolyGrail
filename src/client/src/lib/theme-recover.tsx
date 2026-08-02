'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'hg-theme';

/**
 * ThemeRecover — проставляет `data-theme` на страницах, которые Next рендерит
 * вне корневого layout.
 *
 * @remarks
 * `not-found` и `error` показываются в аварийном скелете `<html
 * id="__next_error__">`, куда inline-скрипт темы не попадает: React вставляет
 * его через innerHTML, а такие теги браузер не исполняет. Из-за этого ночью на
 * тёмном сайте опечатка в адресе выдавала белый экран во весь экран.
 *
 * Здесь тема восстанавливается уже после гидратации, поэтому первый кадр
 * закрывает CSS-правило в `globals.css` — оно срабатывает по системной теме до
 * загрузки JS. Этот компонент поверх него учитывает выбор переключателем.
 */
export function ThemeRecover() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const resolved =
        saved === 'light' || saved === 'dark'
          ? saved
          : window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light';
      if (resolved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    } catch {
      // localStorage недоступен (private mode / CSP) — остаёмся на системной теме.
    }
  }, []);

  return null;
}
