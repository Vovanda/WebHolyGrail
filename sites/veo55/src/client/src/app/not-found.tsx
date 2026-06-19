import Link from 'next/link';

/**
 * Кастомная 404 — на русском, в палитре проекта (cream-фон, Cormorant заголовок,
 * янтарная линия, тёмная CTA). Системная страница, не контент CMS, поэтому
 * текст в коде (исключение из R0 для системных error-страниц).
 *
 * Next 15 показывает её при `notFound()` или при отсутствии маршрута.
 * Layout (SiteLayout с header/footer) оборачивает автоматически.
 */
export default function NotFound() {
  return (
    <section className="bg-bg py-24 md:py-32 text-center">
      <div className="mx-auto max-w-content px-6">
        <p className="font-display text-accent text-7xl md:text-8xl font-semibold leading-none">
          404
        </p>
        <div className="mx-auto mt-6 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
        <h1 className="mt-8 font-display text-3xl md:text-4xl font-semibold text-ink">
          Страница не найдена
        </h1>
        <p className="mt-3 font-display italic text-muted text-lg max-w-md mx-auto">
          Возможно, ссылка устарела или вы свернули не туда.
          <br />
          Не&nbsp;беда&nbsp;— вернёмся к&nbsp;щенкам и&nbsp;собакам.
        </p>
        <div className="mt-10">
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 rounded-full
              bg-accent text-white font-semibold
              px-6 py-3 text-sm tracking-wide
              shadow-[0_4px_12px_rgba(43,34,26,0.10)]
              hover:bg-accent-hover hover:-translate-y-px hover:shadow-[0_6px_16px_rgba(43,34,26,0.14)]
              transition
            "
          >
            ← На главную
          </Link>
        </div>
      </div>
    </section>
  );
}
