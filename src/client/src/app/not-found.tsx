import Link from 'next/link';

/**
 * 404 сайта.
 *
 * @remarks
 * Next 15.5.19 рендерит not-found **вне RootLayout** — в аварийном скелете
 * `<html id="__next_error__">`, куда попадает только клиентский рендер. Из-за
 * этого на 404 не выставляется `data-theme` и тёмный сайт показывает светлую
 * страницу (#66). Inline-скрипт темы тут не спасает: React вставляет его через
 * innerHTML, а такие теги браузер не исполняет.
 *
 * Разметку держим на токенах, чтобы палитра (она приезжает как `<style>` и
 * применяется) отработала хотя бы частично. Полный фикс — в #66.
 */
export default function NotFound() {
  return (
    <section className="bg-page-bg text-ink min-h-screen py-24 md:py-32 text-center px-4">
      <div className="mx-auto max-w-content">
        <div className="font-display text-7xl md:text-8xl font-semibold text-accent">404</div>
        <h1 className="mt-6 font-display text-h3 md:text-h2 font-semibold text-ink">
          Страница не найдена
        </h1>
        <p className="mt-4 text-muted">Возможно, ссылка устарела или адрес введён с опечаткой.</p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center px-5 py-2.5 rounded-md bg-accent text-accent-fg text-sm font-medium hover:bg-accent-hover transition-colors"
        >
          На главную
        </Link>
      </div>
    </section>
  );
}
