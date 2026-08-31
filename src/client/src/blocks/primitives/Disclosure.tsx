import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Disclosure — кусок, свёрнутый до заголовка.
 *
 * @remarks
 * Умеет одно: держать содержимое скрытым, пока по заголовку не нажали. О том,
 * что внутри, не знает - там и ответ на вопрос, и описание записи, и кусок
 * статьи.
 *
 * Собран на `details` и `summary`, без своего кода в браузере: содержимое лежит
 * в разметке с самого начала, поэтому его видит поисковик и находит поиск по
 * странице, а раскрытие работает даже там, где код не выполнился.
 *
 * Вид газетный: прямые углы, тонкая линия по краю, тёмная полупрозрачная
 * полоса заголовка и стрелка, поворачивающаяся при раскрытии. Скругления и
 * тени читались бы как карточка, а это не карточка - это кусок текста,
 * свёрнутый до строки.
 */
export interface DisclosureProps {
  /** Заголовок: виден всегда, по нему и нажимают. */
  readonly title: ReactNode;
  /** Содержимое: появляется раскрытым. */
  readonly children: ReactNode;
  /** Раскрыт сразу - для куска, который важнее прочих. */
  readonly open?: boolean;
  readonly className?: string;
}

export function Disclosure({ title, children, open = false, className }: DisclosureProps) {
  return (
    <details
      data-part="disclosure"
      {...(open ? { open: true } : {})}
      className={cn(
        'group border border-border bg-paper',
        /*
          Полоса заголовка - тёмная плёнка с примесью акцента: цвет узнаётся, но
          остаётся приглушённым, и одинаково ложится на светлую и тёмную тему,
          потому что берётся от тёмной плашки, а не от фона страницы.
        */
        '[--disclosure-tint:color-mix(in_oklab,color-mix(in_oklab,var(--color-accent)_22%,var(--color-dark-block))_92%,transparent)]',
        className,
      )}
    >
      <summary
        data-part="disclosure-title"
        className={cn(
          'flex items-center gap-3 px-5 py-3.5 cursor-pointer list-none select-none',
          'bg-[var(--disclosure-tint)] text-[color:var(--color-dark-block-fg)]',
          'text-[15px] leading-[1.35] font-semibold tracking-[0.01em]',
        )}
      >
        <span
          aria-hidden
          data-part="disclosure-mark"
          className={cn(
            'inline-flex shrink-0 items-center justify-center',
            'transition-transform duration-150 group-open:rotate-90',
            'motion-reduce:transition-none',
          )}
        >
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" aria-hidden>
            <path
              d="M2 1.5 L8 6 L2 10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="square"
              opacity="0.75"
            />
          </svg>
        </span>
        <span className="flex-1">{title}</span>
      </summary>

      <div
        data-part="disclosure-body"
        className="border-t border-border px-5 py-4 text-ink text-[15px] leading-[1.6]"
      >
        {children}
      </div>
    </details>
  );
}
