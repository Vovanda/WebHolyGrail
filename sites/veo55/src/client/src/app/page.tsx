import Link from 'next/link';

import { getPageBySlug, getSiteSettings } from '@/lib/api-client';

/**
 * Главная страница — заглушка-проверка-инфраструктуры.
 *
 * @remarks
 * Реальный layout veo55 (header/nav/footer + блоки) делается в Шаге 4.
 * Сейчас задача — доказать что client читает из cms через `@veo55/contracts`
 * и SSR работает (R3 соблюдён).
 */
export default async function HomePage() {
  const [page, settings] = await Promise.all([
    getPageBySlug('').catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  const siteName = settings?.siteName ?? 'Питомник «Омская Дружина»';

  return (
    <main className="flex-1 mx-auto max-w-content px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{siteName}</h1>
        <p className="mt-3 text-muted">
          veo55.ru — мигрировано на Web Holy Grail (Next 15 + Payload)
        </p>
      </header>

      <section className="rounded-lg border border-border bg-surface p-6">
        <h2 className="text-xl font-semibold mb-3">Инфраструктура поднята</h2>
        <ul className="space-y-1.5 text-sm">
          <li>
            <span className="font-medium">CMS:</span>{' '}
            <code className="text-muted">
              {process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3001'}
            </code>
          </li>
          <li>
            <span className="font-medium">Главная страница (slug=''):</span>{' '}
            {page ? (
              <span className="text-success">найдена в CMS</span>
            ) : (
              <span className="text-muted">пока не создана — заведи в админке</span>
            )}
          </li>
          <li>
            <span className="font-medium">SiteSettings global:</span>{' '}
            {settings ? (
              <span className="text-success">прочитан</span>
            ) : (
              <span className="text-muted">пусто, заполни в админке</span>
            )}
          </li>
        </ul>

        <div className="mt-6 flex gap-3">
          <Link
            href={`${process.env.NEXT_PUBLIC_CMS_URL ?? 'http://localhost:3001'}/admin`}
            className="inline-flex items-center rounded-md bg-primary text-primary-fg px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Открыть админку →
          </Link>
        </div>
      </section>

      <footer className="mt-16 text-xs text-muted">
        Шаг 3, коммит 5 — заглушка. Реальный layout в Шаге 4.
      </footer>
    </main>
  );
}
