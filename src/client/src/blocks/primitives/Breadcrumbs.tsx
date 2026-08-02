import Link from 'next/link';

/**
 * Breadcrumbs — путь до текущей страницы.
 *
 * @remarks
 * Server-only (R14): статичная разметка без состояния.
 *
 * Нужны там, где страница лежит глубже первого уровня: с карточки человека
 * посетитель должен вернуться в каталог одним движением, а не кнопкой «назад»
 * в браузере. Особенно на телефоне, куда часто приходят по прямой ссылке из
 * мессенджера — истории переходов там просто нет.
 *
 * Последний элемент не ссылка: это текущая страница, и делать её кликабельной
 * значит обещать переход, которого не будет.
 */
export interface Crumb {
  readonly label: string;
  readonly href?: string;
}

export function Breadcrumbs({ items }: { readonly items: readonly Crumb[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="hover:text-ink hover:underline underline-offset-2"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={last ? 'text-ink' : undefined}
                  aria-current={last ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
