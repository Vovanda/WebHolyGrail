import type { ReactNode } from 'react';
import type { PanelConfig, SiteLayoutConfig, SiteSettings, SlotName } from '@veo55/contracts';

import { renderPanelContent } from './renderPanelContent';

/**
 * Универсальный layout-движок Holy Grail (Panel/Slot composition).
 *
 * @remarks
 * Один компонент рендерит любую конфигурацию `SiteLayoutConfig`. Когда меняется
 * композиция панелей — внешний вид сайта меняется без правки страничных компонентов.
 * См. R11 в `.claude/rules/common.md` и memo `HolyGrail/reference/veo55-visual-pasport`.
 *
 * **Текущая имплементация (Шаг 4.2b — минимальная):** работают слоты `top` / `center` /
 * `bottom` через CSS Flexbox. Слоты `left` / `right` / `overlay` зарезервированы в
 * контракте, рендер появится когда придёт первый кейс (магазин с категориями /
 * SaaS с overlay-search). До тех пор панели в этих слотах **игнорируются** с
 * предупреждением в dev-консоль — чтобы конфиг не молча терялся.
 */
export function SiteLayout({
  config,
  settings,
  children,
}: {
  readonly config: SiteLayoutConfig;
  readonly settings: SiteSettings;
  readonly children: ReactNode;
}) {
  const grouped = groupPanelsBySlot(config.panels);

  warnUnimplementedSlots(grouped);

  return (
    <div className="flex flex-col min-h-screen bg-bg text-ink">
      {grouped.top.length > 0 && (
        <div data-slot="top" className="flex flex-col">
          {grouped.top.map((panel) => (
            <PanelHost key={panel.id} panel={panel} settings={settings} />
          ))}
        </div>
      )}

      <div data-slot="center" className="flex-1 flex flex-col">
        {grouped.center.length > 0
          ? grouped.center.map((panel) => (
              <PanelHost
                key={panel.id}
                panel={panel}
                settings={settings}
                pageChildren={isPageOutletPanel(panel) ? children : undefined}
              />
            ))
          : children}
      </div>

      {grouped.bottom.length > 0 && (
        <div data-slot="bottom" className="flex flex-col">
          {grouped.bottom.map((panel) => (
            <PanelHost key={panel.id} panel={panel} settings={settings} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Один host вокруг каждой панели. Сейчас тонкий wrapper; в будущем сюда переедет
 * логика collapse/resize/mobile-overlay (когда понадобятся `left` / `right`).
 *
 * `pageChildren` пробрасывается только в page-outlet панель — туда уходит контент
 * страничного маршрута (`app/(site)/.../page.tsx`). Остальные панели рендерят
 * свой контент из конфига.
 */
function PanelHost({
  panel,
  settings,
  pageChildren,
}: {
  readonly panel: PanelConfig;
  readonly settings: SiteSettings;
  readonly pageChildren?: ReactNode;
}) {
  return (
    <section data-panel-id={panel.id} data-panel-slot={panel.slot}>
      {renderPanelContent(panel.content, settings, pageChildren)}
    </section>
  );
}

/**
 * Distinguishes the special system panel that hosts the current page route's content.
 */
function isPageOutletPanel(panel: PanelConfig): boolean {
  return panel.content.kind === 'block' && panel.content.node.blockType === 'page-outlet';
}

/**
 * Группирует панели по slot для удобного рендера.
 */
function groupPanelsBySlot(panels: readonly PanelConfig[]): Record<SlotName, PanelConfig[]> {
  const grouped: Record<SlotName, PanelConfig[]> = {
    top: [],
    bottom: [],
    left: [],
    right: [],
    center: [],
    overlay: [],
  };
  for (const panel of panels) {
    grouped[panel.slot].push(panel);
  }
  return grouped;
}

/**
 * В dev-режиме предупреждает что левая/правая/overlay панели в конфиге есть,
 * но движок их пока не рендерит. Чтобы конфиг не молча терялся.
 */
function warnUnimplementedSlots(grouped: Record<SlotName, PanelConfig[]>): void {
  if (process.env.NODE_ENV !== 'development') return;
  const unimplemented: SlotName[] = ['left', 'right', 'overlay'];
  for (const slot of unimplemented) {
    if (grouped[slot].length > 0) {
      const ids = grouped[slot].map((p) => p.id).join(', ');
      // eslint-disable-next-line no-console
      console.warn(
        `[SiteLayout] slot="${slot}" имеет ${grouped[slot].length} панель(и) (${ids}), ` +
          `но рендер этого слота ещё не реализован. Включим когда появится реальный кейс. R9.`,
      );
    }
  }
}
