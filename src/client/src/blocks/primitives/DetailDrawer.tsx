'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  /**
   * Где показать окно.
   *
   * @remarks
   * `left` — панель на всю высоту: для длинного содержимого, когда полезно
   * видеть список за ней. `center` — диалог посередине: для короткого, где
   * нужно решение, например ввода кода. На узком экране разница исчезает,
   * окно всё равно занимает почти всё место.
   */
  readonly placement?: 'left' | 'center';
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

/**
 * Открывает подробности: панель показывает то, что названо в адресе.
 *
 * @remarks
 * Пока панель закрыта, открытие добавляется в историю - тогда «назад» её
 * закрывает. Переход внутри уже открытой панели историю не копит, а заменяет
 * последнюю запись: иначе цепочка «мать - её мать - её отец» превращалась
 * в стопку, и чтобы уйти со страницы, приходилось закрывать десяток карточек
 * подряд. Панель на экране всё это время одна.
 */
export function openDetail(slug: string): void {
  try {
    const адрес = `#d=${encodeURIComponent(slug)}`;
    const ужеОткрыта = window.location.hash.startsWith('#d=');
    if (ужеОткрыта) {
      window.history.replaceState({ d: slug }, '', адрес);
    } else {
      window.history.pushState({ d: slug }, '', адрес);
    }
    // Force popstate listeners to re-check
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch {
    /* SSR */
  }
}

/**
 * Закрывает подробности одним движением.
 *
 * @remarks
 * Когда открытие лежит в истории, шаг назад её и снимает - адрес возвращается
 * к странице, с которой пришли. По прямой ссылке такой записи нет, и шаг назад
 * увёл бы с сайта: тогда решётка просто убирается из адреса.
 */
export function closeDetail(): void {
  try {
    if (!window.location.hash.startsWith('#d=')) return;
    const наша = (window.history.state as { d?: string } | null)?.d;
    if (наша) {
      window.history.back();
      return;
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } catch {
    /* SSR */
  }
}

export function DetailDrawer({ slug, children, className, placement = 'left' }: DetailDrawerProps) {
  const [open, setOpen] = useState(false);
  /*
    Содержимое остаётся на месте, пока окно растворяется. Снималось оно сразу
    с закрытием, и окно на глазах схлопывалось до одного крестика: кнопка
    исчезала, поле сжималось вверх. Уходить окно должно как было - целиком
    и без движения.
  */
  const [leaving, setLeaving] = useState(false);

  // Окно закрылось - содержимое живёт до конца растворения, потом снимается.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) setLeaving(true);
    if (open) setLeaving(false);
    wasOpen.current = open;
  }, [open]);

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
        onTransitionEnd={(event) => {
          // Только собственное растворение окна: переходы внутренних кнопок
          // всплывают сюда же и снимали содержимое раньше времени.
          if (event.target !== event.currentTarget || event.propertyName !== 'opacity') return;
          if (!open) setLeaving(false);
        }}
        className={cn(
          'fixed z-[61] overflow-y-auto overscroll-contain bg-bg',
          /*
            Окно в середине экрана только растворяется - размеры не меняются.

            Раньше переход шёл по всем свойствам разом и вдобавок ужимал окно:
            на закрытии кнопка исчезала, поле сжималось вниз, крестик дёргался.
            Растворение короче открытия: уходящее окно не должно задерживать.
          */
          'transition-opacity ease-out',
          placement === 'center'
            ? cn(
                'left-1/2 top-1/2 w-[min(92vw,560px)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2',
                'rounded-2xl border border-border shadow-[var(--shadow-overlay)]',
                open ? 'opacity-100 duration-200' : 'pointer-events-none opacity-0 duration-150',
              )
            : cn(
                'transition-transform duration-300',
                'top-0 left-0 h-full w-full max-w-[440px]',
                'shadow-[var(--shadow-overlay-side)]',
                open ? 'translate-x-0' : '-translate-x-full',
              ),
          className,
        )}
      >
        {/* Закрытие — та же кнопка-действие, что бургер и закрытие панели. */}
        <button
          type="button"
          onClick={close}
          aria-label="Закрыть"
          className={cn(
            // Тот же вид, что у кнопки меню и закрытия панели: своих кнопок
            // окно не заводит, иначе они разъезжаются вида к виду.
            'action-button z-[62]',
            placement === 'center'
              ? 'absolute top-3 right-3'
              : 'fixed top-3 right-[max(24px,calc((100vw-1300px)/2+24px))]',
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
        {(open || leaving) && children}
      </aside>
    </>
  );
}
