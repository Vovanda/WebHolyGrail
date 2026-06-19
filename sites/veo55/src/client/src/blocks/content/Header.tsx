import Link from 'next/link';
import type { BlockNode, SiteSettings } from '@veo55/contracts';

/**
 * Header — sticky-шапка сайта veo55.
 *
 * @remarks
 * Палитра тёмного header'а — `#1d1612` (та же что у `.veo-banner` живого veo55),
 * чтобы хедер визуально продолжал баннер сверху и оба смотрелись одной полосой.
 *
 * Лого — пока SVG-плейсхолдер с лапкой (paw-svg будет когда мама пришлёт настоящий
 * логотип). Имя сайта рядом с лапкой, телефон справа, navigation между.
 */
export function Header({
  settings,
}: {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
}) {
  const phone = settings.contacts?.phone;
  const nav = settings.mainNav ?? [];

  return (
    <header className="sticky top-0 z-40 text-bg shadow-md" style={{ background: '#1d1612' }}>
      <div className="mx-auto flex max-w-wide items-center gap-6 px-6 py-3">
        {/* Лого: лапа + имя сайта */}
        <Link href="/" className="flex items-center gap-3 group shrink-0" aria-label="На главную">
          <span
            aria-hidden
            className="
              grid place-items-center h-9 w-9 rounded-full bg-accent/15
              text-accent group-hover:bg-accent/25 transition-colors
            "
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              {/* Простая лапа-силуэт; заменим на присланный лого */}
              <ellipse cx="12" cy="16" rx="5" ry="4" />
              <ellipse cx="5" cy="11" rx="2" ry="2.5" />
              <ellipse cx="19" cy="11" rx="2" ry="2.5" />
              <ellipse cx="9" cy="7" rx="1.8" ry="2.3" />
              <ellipse cx="15" cy="7" rx="1.8" ry="2.3" />
            </svg>
          </span>
          <span className="font-display text-lg md:text-xl font-semibold tracking-wide text-bg group-hover:text-accent transition-colors">
            {settings.siteName ?? 'Питомник «Омская Дружина»'}
          </span>
        </Link>

        {/* Nav — между лого и phone, центрирована за счёт flex-1 */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-7 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className="text-bg/85 hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Телефон справа */}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="hidden sm:inline-block font-display text-base md:text-lg font-semibold text-accent hover:text-accent-hover transition-colors shrink-0"
          >
            {phone}
          </a>
        ) : (
          <span className="hidden sm:inline-block text-bg/30 text-xs italic shrink-0">
            phone in CMS
          </span>
        )}
      </div>
    </header>
  );
}
