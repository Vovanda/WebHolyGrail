'use client';

import { useCallback, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * DetailDrawer — выезжающая слева панель «карточка детали» (item / щенок /
 * помёт). Модалка-overlay не центральная: симметрично NavDrawer (справа).
 *
 * @remarks
 * **URL-shareable.** При открытии: `history.pushState(..., '#d=<type>:<id>')`.
 * Прямая ссылка / шаринг работают. Кнопка «назад» / swipe-back на мобиле /
 * Esc / клик backdrop → `popstate` закрывает (без перехода назад во внешней
 * истории).
 *
 * **Управление снаружи:** parent рендерит `<DetailDrawer slug={...} type={...}>
 * children</DetailDrawer>` — drawer сам слушает hash и открывается. Триггер на
 * клике делает `history.pushState` через хелпер `openDetail()`.
 *
 * **TODO:** портал в `<body>`, focus-trap, lock scroll, transitions.
 */
export interface DetailDrawerProps {
  /** Уникальный ключ — должен совпадать с тем что `openDetail(type, id)` пушит. */
  readonly slug: string;
  /** Контент внутри. */
  readonly children: React.ReactNode;
  /** Класс на сам drawer (по умолчанию 380px). */
  readonly className?: string;
}

function parseHash(): string | null {
  const m = window.location.hash.match(/^#d=([^&]+)/);
  if (!m) return null;
  // Сравнение делаем по декодированному значению, чтобы было устойчиво и для
  // `#d=dog:mars-ares`, и для `#d=dog%3Amars-ares`.
  try {
    return decodeURIComponent(m[1] ?? '');
  } catch {
    return m[1] ?? null;
  }
}

export function openDetail(slug: string): void {
  try {
    window.history.pushState({ d: slug }, '', `#d=${encodeURIComponent(slug)}`);
    // Force popstate listeners to re-check
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch {
    /* SSR */
  }
}

export function DetailDrawer({ slug, children, className }: DetailDrawerProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    if (!open) return;
    setOpen(false);
    try {
      if (window.location.hash.startsWith('#d=')) {
        window.history.back();
      }
    } catch {
      /* */
    }
  }, [open]);

  useEffect(() => {
    function check() {
      const h = parseHash();
      // Открыт пока kind (префикс до `:`) совпадает — каскадная смена ключа
      // внутри того же kind (например rkf:OLD → rkf:NEW при клике родителя)
      // НЕ закрывает drawer. Контент перерисуется через `key` извне (slug
      // меняется → children обновятся), но визуально drawer остаётся
      // открытым. Без этого был flicker close→open 300ms на каждом каскаде.
      if (!h) {
        setOpen(false);
        return;
      }
      const myKind = slug.split(':')[0];
      const hKind = h.split(':')[0];
      if (myKind && hKind) {
        setOpen(myKind === hKind);
      } else {
        setOpen(h === slug);
      }
    }
    check();
    window.addEventListener('hashchange', check);
    window.addEventListener('popstate', check);
    return () => {
      window.removeEventListener('hashchange', check);
      window.removeEventListener('popstate', check);
    };
  }, [slug]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={close}
        className={cn(
          'fixed inset-0 z-[60] bg-ink/55 backdrop-blur-[2px] transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />
      {/* Drawer panel — выезжает слева */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          'fixed top-0 left-0 z-[61] h-full w-full max-w-[440px]',
          'bg-bg shadow-[8px_0_32px_rgba(43,34,26,0.18)]',
          'transition-transform duration-300 ease-out',
          'overflow-y-auto overscroll-contain',
          open ? 'translate-x-0' : '-translate-x-full',
          className,
        )}
      >
        {/* Закрытие — кнопка-крестик в том же положении что бургер-меню
            (top-2 right-4, см. NavDrawer). Использует те же стили, чтобы
            пользователю не приходилось искать «другую» кнопку закрытия. */}
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className={cn(
            'fixed top-3 right-[max(24px,calc((100vw-1300px)/2+24px))] z-[62]',
            'grid place-items-center h-11 w-11 md:h-12 md:w-12 rounded-lg',
            'bg-surface text-ink shadow-sm border border-border',
            // hover-фон совпадает с бургером (#d1c69f).
            'hover:bg-[#d1c69f] hover:border-[#d1c69f] transition-colors',
          )}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
        {open && children}
      </aside>
    </>
  );
}
