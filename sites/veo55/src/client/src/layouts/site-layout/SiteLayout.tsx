import type { ReactNode } from 'react';
import type { PanelConfig, SiteLayoutConfig, SiteSettings, SlotName } from '@veo55/contracts';

import { renderPanelContent } from './renderPanelContent';

/**
 * Универсальный layout-движок Holy Grail (Panel/Slot composition).
 *
 * @remarks
 * Один компонент рендерит любую конфигурацию `SiteLayoutConfig`. Когда меняется
 * композиция панелей — внешний вид сайта меняется без правки страничных компонентов.
 * См. R11 в `.claude/rules/common.md` и `.claude/rules/layouts.md` для дисциплины.
 *
 * **Имплементированные слоты:**
 *  - `top` / `bottom` — обычные горизонтальные полосы (flex column).
 *  - `center` — основной контент. Ширина регулируется `panel.size` (см. centerWidthClass).
 *  - `left` / `right` — **drawer-слои поверх контента** (не отъедают ширину). Сами
 *    drawer-компоненты (`'use client'`) управляют своим open/close-стейтом через
 *    sticky-кнопку. Layout их просто хостит — никакого глобального стейта.
 *
 *  - `overlay` — пока не реализован (для fullscreen-search / modal-host).
 *
 * **Почему drawer'ы не отъедают ширину:** на landing'е (R7 — нулевая нагрузка) контент
 * стабилен по ширине, drawer выезжает поверх с overlay-затемнением. Это паттерн из
 * AVOX, упрощённый под landing — без resize, без двойных табов. См. AVOX MainLayout.
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

  // classic-site = веб-визитка: контент-карточка cream поверх пергамента body.
  // Карточка занимает max-w-wide и тянется через весь center-слот целиком,
  // чтобы все вложенные секции рисовались на одном непрерывном фоне.
  // Тень + скруглённый нижний край — 1:1 из оригинала veo-ui.css:
  //   box-shadow: 0 0 34px rgba(43,34,26,.08); border-radius: 0 0 18px 18px;
  const isClassicSite = (config.grid?.template ?? 'classic-site') === 'classic-site';
  const centerContentClass = isClassicSite
    ? 'relative flex-1 flex flex-col mx-auto w-full max-w-wide bg-bg shadow-[0_0_34px_rgba(43,34,26,0.08)] rounded-b-[18px] overflow-hidden'
    : 'flex-1 flex flex-col';

  return (
    <div className="relative flex flex-col gap-6 min-h-screen text-ink">
      {grouped.top.length > 0 && (
        <div data-slot="top" className="flex flex-col">
          {grouped.top.map((panel) => (
            <PanelHost key={panel.id} panel={panel} settings={settings} />
          ))}
        </div>
      )}

      <div data-slot="center" className={centerContentClass}>
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

      {grouped.left.map((panel) => (
        <PanelHost key={panel.id} panel={panel} settings={settings} />
      ))}
      {grouped.right.map((panel) => (
        <PanelHost key={panel.id} panel={panel} settings={settings} />
      ))}
    </div>
  );
}

/**
 * Map для `panel.size` → tailwind ширинного wrapper-класса в center-слоте.
 *
 * @remarks
 * Семантика, не px. Контракт `panel.size` — строка/число; для center трактуем как:
 *  - `'full'` — full-bleed (банеры, hero-фоны)
 *  - `'wide'` — основной контент сайта (≤ 1300px)
 *  - `'content'` — текст (≤ 880px, читабельный inline-length)
 *  - `'narrow'` — формы / focus-read (≤ 640px)
 *  - undefined → default `'wide'`
 *
 * Числовые значения / произвольный CSS пока **не** поддерживаем — добавим когда
 * понадобится реальный кейс (R9). Для left/right `panel.size` интерпретируется
 * самим drawer-блоком (ширина в px).
 */
function centerWidthClass(size: PanelConfig['size']): string {
  switch (size) {
    case 'full':
      return '';
    case 'content':
      return 'mx-auto w-full max-w-content px-6';
    case 'narrow':
      return 'mx-auto w-full max-w-[640px] px-6';
    case 'wide':
    case undefined:
      return 'mx-auto w-full max-w-wide px-6';
    default:
      return 'mx-auto w-full max-w-wide px-6';
  }
}

/**
 * Wrapper вокруг каждой панели. Для center применяет ширинный класс; для left/right
 * рендерит без обёртки (drawer-компонент сам отвечает за fixed-позицию и анимацию).
 *
 * `pageChildren` пробрасывается только в page-outlet — туда уходит контент
 * страничного маршрута. Остальные панели рендерят свой контент из конфига.
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
  if (panel.slot === 'left' || panel.slot === 'right') {
    return (
      <section data-panel-id={panel.id} data-panel-slot={panel.slot}>
        {renderPanelContent(panel.content, settings, pageChildren)}
      </section>
    );
  }

  if (panel.slot === 'center') {
    const wrapClass = centerWidthClass(panel.size);
    return (
      <section
        data-panel-id={panel.id}
        data-panel-slot={panel.slot}
        data-panel-size={panel.size ?? 'wide'}
      >
        {wrapClass ? (
          <div className={wrapClass}>
            {renderPanelContent(panel.content, settings, pageChildren)}
          </div>
        ) : (
          renderPanelContent(panel.content, settings, pageChildren)
        )}
      </section>
    );
  }

  return (
    <section data-panel-id={panel.id} data-panel-slot={panel.slot}>
      {renderPanelContent(panel.content, settings, pageChildren)}
    </section>
  );
}

function isPageOutletPanel(panel: PanelConfig): boolean {
  return panel.content.kind === 'block' && panel.content.node.blockType === 'page-outlet';
}

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

function warnUnimplementedSlots(grouped: Record<SlotName, PanelConfig[]>): void {
  if (process.env.NODE_ENV !== 'development') return;
  const unimplemented: SlotName[] = ['overlay'];
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
