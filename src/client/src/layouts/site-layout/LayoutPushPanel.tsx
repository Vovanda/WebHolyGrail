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

export function LayoutPushPanel({ side, width, title, children }: LayoutPushPanelProps) {
  return (
    <SidePanel
      side={side}
      {...(width ? { width } : {})}
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
