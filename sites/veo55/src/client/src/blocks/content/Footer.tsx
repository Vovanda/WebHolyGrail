import Link from 'next/link';
import type { BlockNode, SiteSettings } from '@veo55/contracts';

/**
 * Footer — тёмный «нижний слой за сайтом». В обычном потоке после контента;
 * виден когда контент-карточка докручена до конца. Контент-карточка имеет
 * shadow-bottom, визуально приподнимается «шторкой» открывая footer.
 */
export function Footer({
  settings,
}: {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
}) {
  const { siteName, contacts, footerNav, mainNav, social } = settings;
  const nav = footerNav?.length ? footerNav : (mainNav ?? []);

  return (
    <footer
      className="relative w-full text-bg"
      style={{
        background: '#3d342a',
        // 1) тонкая чёткая линия-граница сверху
        // 2) inset-тень — «сайт сверху отбрасывает тень на footer»
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 14px 22px -14px rgba(0,0,0,0.55)',
        borderTop: '1px solid rgba(43,34,26,0.35)',
      }}
    >
      <div className="mx-auto max-w-wide px-6 py-12 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-display text-lg font-semibold">{siteName}</div>
          {contacts?.address && <p className="mt-2 text-sm text-bg/70">{contacts.address}</p>}
          {contacts?.hours && <p className="mt-1 text-sm text-bg/60">{contacts.hours}</p>}
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-bg/85 hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2 text-sm">
          {contacts?.phone && (
            <a
              href={`tel:${contacts.phone.replace(/[^+\d]/g, '')}`}
              className="text-accent hover:text-accent-hover font-semibold"
            >
              {contacts.phone}
            </a>
          )}
          {contacts?.email && (
            <a
              href={`mailto:${contacts.email}`}
              className="text-bg/85 hover:text-accent transition-colors"
            >
              {contacts.email}
            </a>
          )}
          {social?.length ? (
            <div className="mt-2 flex gap-3">
              {social.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bg/70 hover:text-accent capitalize text-sm transition-colors"
                >
                  {s.label ?? s.platform}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-bg/10 py-4 text-center text-xs text-bg/50">
        © {new Date().getFullYear()} {siteName} · built on Web Holy Grail
      </div>
    </footer>
  );
}
