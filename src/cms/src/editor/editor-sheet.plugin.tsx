'use client';

import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client';
import { useConfig } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

import { useSheetAlign } from './sheet-align-store';
import { sheetSize, type SheetSize } from './sheet-layout';

/**
 * Лист у одного редактора: ширина колонки сайта и положение.
 *
 * @remarks
 * Ширину колонки выбирает владелец в настройках сайта, поэтому она читается
 * из глобала при открытии редактора: смена варианта видна со следующего
 * открытия без правки кода. Пока ответа нет, листа нет - поле выглядит
 * как обычно, а не прыгает с одной ширины на другую.
 *
 * Разметку плагин не рисует: он отдаёт контейнеру редактора переменные
 * и признак, остальное делают стили админки.
 */
export function EditorSheetPlugin() {
  const { editorContainerRef } = useEditorConfigContext();
  const { config } = useConfig();
  const align = useSheetAlign();
  const [size, setSize] = useState<SheetSize | null>(null);
  const api = `${config.serverURL}${config.routes.api}`;

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${api}/globals/site-settings?depth=0`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings: { blog?: { columnWidth?: unknown } } | null) =>
        setSize(sheetSize(settings?.blog?.columnWidth)),
      )
      .catch(() => undefined);
    return () => controller.abort();
  }, [api]);

  useEffect(() => {
    const element = editorContainerRef.current;
    if (!element || !size) return;
    element.dataset['whgSheet'] = align;
    element.style.setProperty('--whg-sheet-width', `${size.sheet}px`);
    element.style.setProperty('--whg-sheet-text', `${size.text}px`);
    return () => {
      delete element.dataset['whgSheet'];
      element.style.removeProperty('--whg-sheet-width');
      element.style.removeProperty('--whg-sheet-text');
    };
  }, [editorContainerRef, size, align]);

  return null;
}
