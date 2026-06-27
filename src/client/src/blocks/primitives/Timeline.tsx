'use client';

import { useState } from 'react';
import type { BlockNode, SiteSettings } from 'contracts';

import { ContentFrame } from '@/layouts/ContentFrame';

interface TimelineEntry {
  readonly year: string;
  readonly icon?: string;
  readonly body: string;
}

/**
 * Timeline — вертикальный список истории / «нашего пути».
 *
 *  - max-width 880, padding-left/right 40, border-left 2px stone
 *  - точка-маркер: 14×14, accent, трёхслойная (3px кант кремового + 2px stone-обвод)
 *  - год: Cormorant 28px font-weight 600 letter-spacing 0.5
 *  - расстояние между записями: padding-bottom 36
 *
 * Поведение: первые `visibleCount` записей видны всегда; остальные скрыты под
 * кнопкой «Показать всю историю ⌄». Клик раскрывает остальное, кнопка исчезает.
 */
type SortMode = 'year-desc' | 'year-asc' | 'manual';

export function Timeline({
  node,
}: {
  readonly node: BlockNode & {
    data?: {
      entries?: readonly TimelineEntry[];
      visibleCount?: number;
      sort?: SortMode;
    };
  };
  readonly settings: SiteSettings;
}) {
  const rawEntries: readonly TimelineEntry[] = node.data?.entries ?? [];
  const visibleCount = node.data?.visibleCount ?? 3;
  const sort: SortMode = node.data?.sort ?? 'year-desc';

  const entries = sortEntries(rawEntries, sort);

  const [expanded, setExpanded] = useState(false);

  const hidden = entries.length - visibleCount;

  return (
    <section className="bg-bg py-12 md:py-16">
      <ContentFrame side="right" decor="vines" className="px-6">
        <h2 className="text-center font-display text-3xl md:text-h2 font-semibold text-ink">
          Наш путь
        </h2>
        <div className="mx-auto mt-4 mb-10 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />

        <ol className="px-10 border-l-4 border-border">
          {entries.map((entry, idx) => {
            const isHiddenInitially = idx >= visibleCount;
            const isVisible = !isHiddenInitially || expanded;
            // Свёрнутые items УБИРАЮТСЯ из layout (`display: none`) — без
            // «разжатия» max-height-ом. При expanded — рендерятся сразу со
            // своим финальным размером и плавно проявляются opacity 0→1.
            // Требование: «всё должно быть уже отрендерено, просто плавно
            // раскрыться и недостающее плавно проявится».
            if (!isVisible) return null;
            return (
              <li
                key={entry.year}
                className="relative pb-9"
                style={
                  isHiddenInitially
                    ? {
                        animation: 'hg-fade-in 500ms ease-out both',
                        animationDelay: `${(idx - visibleCount) * 80}ms`,
                      }
                    : undefined
                }
              >
                {/*
                  Соосность точки с вертикальной линией:
                  - `<ol>` имеет `border-l-4` (4px) → центр линии в x=2 от левого края ol.
                  - `<ol>` имеет `px-10` (padding-left 40px) → `<li>` content начинается в x=44.
                  - Точка width=14px (центр на +7). Чтобы центр точки совпал с центром линии (x=2),
                    нужно `left = 2 - 7 - 44 = -49px` относительно `<li>`.
                  instance admin 2026-06-25 14:25: «точки чуть левее чем надо» — было -47 (центр x=4, на 2px правее линии).
                */}
                <span
                  aria-hidden
                  className="
                    absolute -left-[49px] top-2 h-[14px] w-[14px] rounded-full
                    bg-accent border-[3px] border-bg
                  "
                  style={{ boxShadow: '0 0 0 2px var(--color-border)' }}
                />
                <div className="flex items-baseline gap-3">
                  <span className="emoji-fix w-6 text-lg shrink-0" aria-hidden>
                    {entry.icon ?? ''}
                  </span>
                  <h3 className="font-display text-[28px] font-semibold tracking-[0.5px] leading-tight text-ink mb-1">
                    {entry.year}
                  </h3>
                </div>
                <p className="text-ink/90 leading-relaxed">{entry.body}</p>
              </li>
            );
          })}
        </ol>

        {hidden > 0 && (
          <ExpandToggle
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            {...(entries[entries.length - 1]?.year
              ? { sinceYear: entries[entries.length - 1]!.year }
              : {})}
          />
        )}
      </ContentFrame>
    </section>
  );
}

/**
 * Сортировка по числу из строки года. `manual` сохраняет порядок drag-sort.
 * Год парсится через первое число в строке — поддерживает «2026», «2026-2027», «весна 2024».
 */
function sortEntries(entries: readonly TimelineEntry[], sort: SortMode): readonly TimelineEntry[] {
  if (sort === 'manual') return entries;
  const withYear = entries.map((e) => {
    const m = e.year.match(/-?\d{2,4}/);
    return { entry: e, num: m ? Number(m[0]) : 0 };
  });
  withYear.sort((a, b) => (sort === 'year-desc' ? b.num - a.num : a.num - b.num));
  return withYear.map((x) => x.entry);
}

function ExpandToggle({
  expanded,
  onToggle,
  sinceYear,
}: {
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly sinceYear?: string;
}) {
  const label = expanded
    ? 'Свернуть историю'
    : sinceYear
      ? `Показать историю с ${sinceYear} года`
      : 'Показать всю историю';
  return (
    <div className="mt-10 flex items-center gap-5">
      <span aria-hidden className="flex-1 h-px bg-border" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group inline-flex items-center gap-2 font-display italic text-muted hover:text-accent transition-colors text-base md:text-lg"
      >
        <span>{label}</span>
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 transition-transform duration-300 ease-out"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          aria-hidden
        >
          <path
            d="M5 7l5 6 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span aria-hidden className="flex-1 h-px bg-border" />
    </div>
  );
}
