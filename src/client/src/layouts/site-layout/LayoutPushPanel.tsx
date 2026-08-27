'use client';

import type { ReactNode } from 'react';

import { SidePanel } from '@/blocks/primitives/SidePanel';

/**
 * Сдвигающая панель, собранная раскладкой.
 *
 * @remarks
 * Примитив `SidePanel` принимает кнопку функцией - так вызывающий код рисует
 * её по-своему. Раскладка серверная, а функцию из серверной части клиентской
 * передать нельзя, поэтому кнопка-язычок живёт здесь: раскладка отдаёт только
 * данные, а разметку собирает этот клиентский слой.
 *
 * Язычок стоит у края по середине высоты: там его находят, не разглядывая
 * страницу, и он не спорит с кнопкой меню в шапке, когда панелей две.
 */
export interface LayoutPushPanelProps {
  readonly side: 'left' | 'right';
  readonly width?: string | undefined;
  readonly title?: string | undefined;
  readonly children: ReactNode;
}

/**
 * Ширина панели с оглядкой на экран.
 *
 * @remarks
 * В раскладке ширину задают числом - «двадцать пять em», не думая про телефон.
 * На узком экране такая панель вылезает за край: заголовок обрезается, а
 * полоска страницы сбоку, по которой видно, что страница никуда не делась,
 * пропадает вовсе.
 *
 * Поэтому здесь ширина ограничивается долей экрана. Ограничение живёт в слое
 * раскладки, а не в конфиге: иначе каждый, кто заводит панель, должен помнить
 * про телефон и писать одно и то же.
 */
export function widthWithinScreen(width: string | undefined): string | undefined {
  if (!width) return undefined;
  // Уже посчитанное значение не трогаем: автор знал, что делал.
  if (width.includes('min(') || width.includes('vw')) return width;
  return `min(${width}, 88vw)`;
}

export function LayoutPushPanel({ side, width, title, children }: LayoutPushPanelProps) {
  const panelWidth = widthWithinScreen(width);

  return (
    <SidePanel
      side={side}
      {...(panelWidth ? { width: panelWidth } : {})}
      title={title}
      trigger={({ open, isOpen }) => (
        <button
          type="button"
          onClick={open}
          aria-expanded={isOpen}
          className={[
            'fixed top-1/2 z-[53] -translate-y-1/2 border border-border bg-paper',
            'px-2 py-4 text-sm text-muted shadow-sm transition-colors hover:text-ink',
            side === 'left' ? 'left-0 rounded-r-lg' : 'right-0 rounded-l-lg',
          ].join(' ')}
        >
          <span className="[writing-mode:vertical-rl]">{title ?? 'Панель'}</span>
        </button>
      )}
    >
      {children}
    </SidePanel>
  );
}
