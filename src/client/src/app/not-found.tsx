import Link from 'next/link';

/**
 * Default 404 — рендерится внутри RootLayout (с Header/Footer), не как
 * standalone Next.js default 404-boundary.
 */
export default function NotFound() {
  return (
    <section className="py-24 md:py-32 text-center px-4">
      <div className="mx-auto max-w-content">
        <div className="font-display text-7xl md:text-8xl font-semibold text-accent">404</div>
        <h1 className="mt-6 font-display text-h3 md:text-h2 font-semibold text-ink">
          Страница не найдена
        </h1>
        <p className="mt-4 text-muted">Возможно, ссылка устарела или адрес введён с опечаткой.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center px-5 py-2.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          На главную
        </Link>
      </div>
    </section>
  );
}
