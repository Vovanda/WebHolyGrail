'use client';

/**
 * FaqToggleAllButtons — кнопки «Развернуть всё / Свернуть всё».
 *
 * Client-island внутри Server `FaqAccordion`. Просто проходит по всем
 * `<details data-faq-item>` и ставит / снимает `open`. Без state, без
 * подписок — DOM-only.
 *
 * Бренд: pill-buttons как в legacy. «Развернуть» — заполненная янтарная,
 * «Свернуть» — outlined ghost.
 */
import { cn } from '@/lib/utils';

function toggleAll(open: boolean): void {
  const items = document.querySelectorAll<HTMLDetailsElement>('details[data-faq-item]');
  items.forEach((el) => {
    if (open) el.setAttribute('open', '');
    else el.removeAttribute('open');
  });
}

export function FaqToggleAllButtons() {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-4">
      <button
        type="button"
        onClick={() => toggleAll(true)}
        className={cn(
          'inline-flex items-center min-h-[36px] px-[18px] rounded-full',
          'bg-accent text-paper border-0 font-bold text-[13.5px]',
          'cursor-pointer transition-colors duration-150 hover:bg-accent-hover',
        )}
      >
        Развернуть всё
      </button>
      <button
        type="button"
        onClick={() => toggleAll(false)}
        className={cn(
          'inline-flex items-center min-h-[36px] px-[18px] rounded-full',
          'bg-transparent text-ink border border-border font-bold text-[13.5px]',
          'cursor-pointer transition-colors duration-150 hover:bg-surface',
        )}
      >
        Свернуть всё
      </button>
    </div>
  );
}
