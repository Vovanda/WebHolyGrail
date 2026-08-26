'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Боковая панель, которая сдвигает контент, а не перекрывает его.
 *
 * @remarks
 * Второй режим боковой панели рядом с overlay-drawer навигации: там окно
 * ложится поверх страницы, здесь страница отъезжает. Разница по смыслу: overlay
 * говорит «вернись, когда закончишь», сдвиг — «это часть той же работы»,
 * поэтому список серии, оглавление и фильтры удобнее сдвигом.
 *
 * Состояние живёт внутри панели, а центр отодвигается правилом в стилях по
 * признаку на `body`. Это сделано намеренно: конфигурация панелей у нас
 * сериализуемая (R5+) и React-узлов не хранит, а поднимать состояние в лейаут
 * ради одного числа значило бы связать его со всеми страницами сразу.
 *
 * На узком экране страница отъезжает целиком, на широком — ужимается: место
 * есть, и выталкивать правый край за экран незачем.
 */
export interface SidePanelProps {
  /** Кнопка, которая открывает панель. Рисуется вызывающим кодом. */
  readonly trigger: (props: { open: () => void; isOpen: boolean }) => React.ReactNode;
  readonly children: React.ReactNode;
  readonly side?: 'left' | 'right';
  /** Ширина панели: она же задаёт, насколько отъезжает контент. */
  readonly width?: string;
  readonly title?: string | undefined;
  readonly className?: string;
}

export function SidePanel({
  trigger,
  children,
  side = 'left',
  width = '20rem',
  title,
  className,
}: SidePanelProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Признак для стилей и ширина сдвига. Снимается при закрытии и при уходе
  // со страницы: иначе следующая страница откроется сдвинутой.
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    body.dataset['sidePanel'] = side;
    body.style.setProperty('--side-panel-width', width);
    return () => {
      delete body.dataset['sidePanel'];
      body.style.removeProperty('--side-panel-width');
    };
  }, [open, side, width]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  return (
    <>
      {trigger({ open: () => setOpen((value) => !value), isOpen: open })}

      <aside
        aria-hidden={!open}
        style={{ width }}
        className={cn(
          'fixed top-0 bottom-0 z-[55] flex flex-col overflow-y-auto overscroll-contain',
          'border-border bg-bg transition-transform duration-300 ease-out',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          open ? 'translate-x-0' : side === 'left' ? '-translate-x-full' : 'translate-x-full',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-body font-medium text-ink">{title ?? 'Панель'}</span>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 p-4">{children}</div>
      </aside>
    </>
  );
}
