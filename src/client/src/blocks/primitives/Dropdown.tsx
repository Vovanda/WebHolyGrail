import { cn } from '@/lib/utils';

/**
 * Dropdown - кнопка-таблетка и раскрывающаяся под ней панель.
 *
 * @remarks
 * Рисуется на сервере на `<details>`: без JS открывается и закрывается сам
 * браузер (R14), содержимое - обычные ссылки и формы. Закрытие по щелчку мимо
 * и по Esc добавляет `DropdownCloser` - один на страницу.
 *
 * Части: `dropdown` - весь кубик, `dropdown-toggle` - кнопка,
 * `dropdown-panel` - панель. `active` красит кнопку как выбранную: внутри
 * выбрано хоть одно значение.
 */
export function Dropdown({
  label,
  active = false,
  align = 'start',
  className,
  children,
}: {
  readonly label: React.ReactNode;
  readonly active?: boolean;
  /** К какому краю кнопки прижата панель. */
  readonly align?: 'start' | 'end';
  readonly className?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <details data-part="dropdown" data-dropdown="" className={cn('group relative', className)}>
      <summary
        data-part="dropdown-toggle"
        className={cn(
          'inline-flex min-h-10 cursor-pointer list-none items-center gap-1.5 rounded-full border px-4 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden',
          active
            ? 'border-accent bg-accent-soft text-ink'
            : 'border-border bg-surface text-ink hover:border-border-strong',
        )}
      >
        {label}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0 transition-transform group-open:rotate-180"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div
        data-part="dropdown-panel"
        className={cn(
          'absolute top-full z-30 mt-1 max-h-[60vh] min-w-56 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-lg',
          align === 'end' ? 'right-0' : 'left-0',
        )}
      >
        {children}
      </div>
    </details>
  );
}
