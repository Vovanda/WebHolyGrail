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
 * Значок слева меняется без кода: закрытый показывает один, открытый - другой,
 * оба лежат в разметке, лишний прячется правилом стиля.
 */
export interface DisclosureProps {
  /** Заголовок: виден всегда, по нему и нажимают. */
  readonly title: ReactNode;
  /** Содержимое: появляется раскрытым. */
  readonly children: ReactNode;
  /** Раскрыт сразу - для куска, который важнее прочих. */
  readonly open?: boolean;
  /** Значок закрытого состояния. */
  readonly closedMark?: ReactNode;
  /** Значок раскрытого состояния. */
  readonly openMark?: ReactNode;
  readonly className?: string;
}

export function Disclosure({
  title,
  children,
  open = false,
  closedMark = '+',
  openMark = '−',
  className,
}: DisclosureProps) {
  return (
    <details
      data-part="disclosure"
      {...(open ? { open: true } : {})}
      className={cn(
        'group bg-paper border border-border rounded-[12px]',
        'transition-shadow duration-150 hover:shadow-sm',
        'open:bg-surface open:border-accent',
        className,
      )}
    >
      <summary
        data-part="disclosure-title"
        className={cn(
          'flex items-center gap-3 px-4 py-3.5 min-h-12 cursor-pointer list-none',
          'text-ink text-[15px] leading-[1.35] select-none',
          'font-semibold group-open:font-bold',
        )}
      >
        <span
          aria-hidden
          data-part="disclosure-mark"
          className={cn(
            'inline-flex items-center justify-center shrink-0',
            'w-7 h-7 rounded-full text-[18px] font-bold leading-none',
            'bg-accent text-accent-fg',
            'group-open:hidden',
          )}
        >
          {closedMark}
        </span>
        <span
          aria-hidden
          data-part="disclosure-mark-open"
          className={cn(
            'hidden group-open:inline-flex items-center justify-center shrink-0',
            'w-7 h-7 rounded-full text-[18px] font-bold leading-none',
            'bg-surface text-ink border border-border',
          )}
        >
          {openMark}
        </span>
        <span className="flex-1">{title}</span>
      </summary>

      <div
        data-part="disclosure-body"
        className="px-4 pb-4 pt-1 text-ink text-[15px] leading-[1.55]"
      >
        {children}
      </div>
    </details>
  );
}
