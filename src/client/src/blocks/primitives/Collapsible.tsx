'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Collapsible - длинный блок свёрнут до высоты и раскрывается кнопкой.
 *
 * @remarks
 * Кнопки нет, если содержимое и так помещается. Свёрнутое закрыто плавным
 * переходом в цвет фона, чтобы обрез не выглядел оборванной строкой. Без JS
 * блок показан целиком (R14): сворачивает его только браузер.
 *
 * Части: `collapsible`, `collapsible-body`, `collapsible-toggle`.
 */
export function Collapsible({
  height = 240,
  more = 'Показать полностью',
  less = 'Свернуть',
  className,
  children,
}: {
  /** Высота свёрнутого блока в точках. */
  readonly height?: number;
  readonly more?: string;
  readonly less?: string;
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  const body = useRef<HTMLDivElement>(null);
  const [long, setLong] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const check = () => setLong(el.scrollHeight > height + 24);
    check();
    const watch = new ResizeObserver(check);
    watch.observe(el);
    return () => watch.disconnect();
  }, [height]);

  const folded = long && !open;
  return (
    <div data-part="collapsible" className={className}>
      <div
        ref={body}
        data-part="collapsible-body"
        className={cn('relative', folded && 'max-h-[var(--collapsed)] overflow-hidden')}
        style={{ '--collapsed': `${height}px` } as React.CSSProperties}
      >
        {children}
        {folded && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg to-transparent"
          />
        )}
      </div>
      {long && (
        <button
          type="button"
          data-part="collapsible-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="mt-3 text-sm font-medium text-accent underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-accent"
        >
          {open ? less : more}
        </button>
      )}
    </div>
  );
}
