import type { ReactNode } from 'react';
import type { PanelContent, SiteSettings } from 'contracts';

import { renderBlockNode } from './block-registry';

/**
 * Рендерит содержимое панели — либо blockNode, либо route-ref (для tool-UI).
 *
 * @remarks
 * `route` сейчас рендерится как заглушка (для публичного сайта-визитки tabs-в-layout
 * не используются, R11). Полноценная имплементация route-panel появится когда
 * понадобится admin/dashboard-режим (Шаг N+).
 *
 * `extraChildren` пробрасывается только в специальные системные блоки (PageOutlet).
 * Обычные блоки его игнорируют.
 */
export function renderPanelContent(
  content: PanelContent,
  settings: SiteSettings,
  extraChildren?: ReactNode,
) {
  if (content.kind === 'block') {
    return renderBlockNode(content.node, settings, extraChildren);
  }

  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn(
      `[renderPanelContent] route-panel (${content.path}) не реализована. ` +
        `Используй блочные панели для публичного сайта (R11). Route-panel — для admin/dashboard.`,
    );
  }
  return null;
}
