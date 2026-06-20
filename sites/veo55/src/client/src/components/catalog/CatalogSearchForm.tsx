'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';

/**
 * CatalogSearchForm — поле поиска по РКФ-каталогу с автокомплитом (топ-8 по
 * мере ввода) и keyboard-нав. Один-в-один с legacy `articles/catalog.html`
 * `<form#vcat-search>`: pill-input + button-pill, dropdown под полем.
 *
 * **Client Component (R14):** debounce + keydown + DOM-focus — DOM-input,
 * SSR не уместен.
 *
 * **Поведение:**
 *  - debounce 350мс на input → `GET /api/rkf/search?q=X&page=1`, показываем 8
 *  - submit / Enter → переход на `/catalog?name=<q>`
 *  - клик по подсказке → переход на `/catalog?dog=<id>`
 *  - ArrowUp/Down — навигация по подсказкам, Enter — переход, Esc — закрыть
 *
 * **Доступность:** `role="combobox" aria-expanded aria-controls aria-activedescendant`
 * + связь подсказок через `id`.
 */
export interface CatalogSearchFormProps {
  readonly initialQuery?: string;
}

interface Suggestion {
  readonly id: number;
  readonly name: string;
  readonly birth?: string;
}

export function CatalogSearchForm({ initialQuery = '' }: CatalogSearchFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  function scheduleSearch(q: string) {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/rkf/search?q=${encodeURIComponent(q.trim())}&page=1`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error('rkf search failed');
        const data = (await res.json()) as { items?: Suggestion[] };
        setItems((data.items ?? []).slice(0, 8));
        setActive(-1);
        setOpen(true);
      } catch {
        setItems([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 350);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q.length < 2) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/catalog?name=${encodeURIComponent(q)}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      const it = items[active];
      if (it) router.push(`/catalog?dog=${it.id}`);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    }
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="relative max-w-[560px] mx-auto mb-[22px]"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        autoComplete="off"
        placeholder="Например: ЯБЛОНЯ В ЦВЕТУ"
        role="combobox"
        aria-expanded={open}
        aria-controls="vcat-suggest"
        aria-activedescendant={active >= 0 ? `vcat-sug-${items[active]?.id}` : undefined}
        onChange={(e) => {
          setValue(e.target.value);
          scheduleSearch(e.target.value);
        }}
        onKeyDown={onKeyDown}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        className={cn(
          'w-full box-border min-h-[48px] pl-[22px] pr-[110px] py-3',
          'text-[15px] text-ink bg-paper border-[1.5px] border-[#E5DCC9] rounded-full',
          'outline-none transition-colors transition-shadow duration-150',
          'focus:border-accent focus:shadow-[0_0_0_4px_rgba(212,164,55,0.18)]',
        )}
      />
      <button
        type="submit"
        className={cn(
          'absolute right-1.5 top-1.5 h-9 px-[18px]',
          'bg-accent text-paper border-0 rounded-full',
          'font-bold text-[13.5px] cursor-pointer transition-colors duration-120',
          'hover:bg-accent-dark',
        )}
      >
        Найти
      </button>

      {open && (
        <div
          id="vcat-suggest"
          role="listbox"
          className={cn(
            'absolute top-[calc(100%+6px)] left-0 right-0 bg-paper',
            'border border-[#E5DCC9] rounded-[14px] shadow-[0_8px_24px_rgba(43,34,26,0.12)]',
            'overflow-hidden z-10 max-h-[380px] overflow-y-auto',
          )}
        >
          {loading && items.length === 0 && (
            <div className="px-4 py-3.5 text-[15px] font-display italic text-muted text-center">
              Ищу…
            </div>
          )}
          {!loading && items.length === 0 && value.trim().length >= 2 && (
            <div className="px-4 py-3.5 text-[15px] font-display italic text-muted text-center">
              По запросу «{value.trim()}» ничего не найдено
            </div>
          )}
          {items.map((it, i) => (
            <a
              key={it.id}
              id={`vcat-sug-${it.id}`}
              role="option"
              aria-selected={i === active}
              href={`/catalog?dog=${it.id}`}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 no-underline text-ink',
                'border-b border-[#F4EAD7] last:border-b-0 transition-colors duration-120',
                'hover:bg-[#FFF9E8]',
                i === active && 'bg-[#FFF9E8]',
              )}
              onMouseEnter={() => setActive(i)}
            >
              <img
                src={`https://www.veorkf.ru/catalog/showphoto.php?id=${it.id}&n=0&s=80`}
                alt=""
                loading="lazy"
                className="w-9 h-9 rounded-full bg-[#F3EFE7] shrink-0 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
                }}
              />
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-[13.5px] uppercase tracking-[0.2px] leading-[1.2] block">
                  {it.name}
                </span>
                {it.birth && (
                  <span className="font-display italic text-[14px] text-muted leading-[1] mt-0.5 block">
                    {it.birth}
                  </span>
                )}
              </span>
            </a>
          ))}
        </div>
      )}
    </form>
  );
}
