'use client';

import { useEffect, useState } from 'react';

import { SidePanel } from '../SidePanel';
import { primaryButton } from './ui';

/** Панель была открыта перед переходом: фильтр работает ссылками, и страница перезагружается. */
const REOPEN = 'whg-filters-open';

/**
 * Расширенный фильтр выдачи в боковой панели слева - на любой ширине.
 *
 * @remarks
 * Части: кнопка «Все фильтры» со счётом выбранного (`filter-toggle`), панель
 * с фильтром (`filter`), внизу «Сбросить» и «Показать N» (`filter-show`).
 * Панель сдвигает страницу (`SidePanel`, режим push из whg-layouts), как
 * плейлист у плеера: фильтр - часть той же работы, а не окно поверх. На
 * странице фильтр места не занимает, плитка стоит во всю ширину.
 *
 * Каждый выбор - переход по адресу, поэтому панель помнит, что была открыта,
 * и после перехода открывается снова уже с новым числом найденного: человек
 * выбирает несколько значений подряд, не открывая её заново.
 */
export function CatalogFilters({
  found,
  selected,
  resetHref,
  children,
}: {
  readonly found: number;
  /** Сколько условий выбрано - число на кнопке. */
  readonly selected: number;
  /** Адрес без условий фильтра; пусто - сбрасывать нечего. */
  readonly resetHref: string | null;
  readonly children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(REOPEN)) setOpen(true);
      window.sessionStorage.removeItem(REOPEN);
    } catch {
      // Хранилище недоступно - панель просто не откроется сама после выбора.
    }
  }, []);

  // Выбор внутри панели уводит на новый адрес: запоминаем, что её надо открыть снова.
  const remember = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement;
    if (event.type === 'submit' || target.closest('a[href]')) {
      try {
        window.sessionStorage.setItem(REOPEN, '1');
      } catch {
        // См. выше.
      }
    }
  };

  return (
    <SidePanel
      side="left"
      width="min(22rem, 88vw)"
      title="Все фильтры"
      open={open}
      onOpenChange={setOpen}
      trigger={({ open: show, isOpen }) => (
        <button
          type="button"
          onClick={show}
          data-part="filter-toggle"
          aria-expanded={isOpen}
          className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
            selected > 0
              ? 'border-accent text-accent'
              : 'border-border-strong text-ink hover:border-ink'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="16" cy="6" r="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
            <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="2" />
          </svg>
          Все фильтры
          {selected > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs tabular-nums text-accent-fg">
              {selected}
            </span>
          )}
        </button>
      )}
    >
      <div data-part="filter" onClickCapture={remember} onSubmitCapture={remember}>
        {children}
      </div>
      <div className="sticky bottom-0 -mx-4 mt-6 flex items-center gap-3 border-t border-border bg-[inherit] px-4 py-3">
        {resetHref && (
          <a
            href={resetHref}
            onClick={remember}
            className="min-h-11 content-center px-2 text-sm text-muted transition-colors hover:text-ink"
          >
            Сбросить
          </a>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          data-part="filter-show"
          className={`${primaryButton} min-h-11 flex-1`}
        >
          {found > 0 ? `Показать ${found}` : 'Ничего не найдено'}
        </button>
      </div>
    </SidePanel>
  );
}
