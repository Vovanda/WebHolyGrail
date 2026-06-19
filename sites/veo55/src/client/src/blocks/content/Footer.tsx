import Link from 'next/link';
import type { BlockNode, SiteSettings } from '@veo55/contracts';

/**
 * Footer — тёмный узкий нижний блок с контактами, навигацией и соцсетями.
 *
 * @remarks
 * Заглушка для Шага 4.2b. Полноценный footer с лозами и графическими акцентами — Шаг 4.3+.
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
    <footer className="bg-ink text-bg mt-12">
      <div className="mx-auto max-w-wide px-6 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <div className="font-display text-lg font-semibold">{siteName}</div>
          {contacts?.address && <p className="mt-2 text-sm text-bg/70">{contacts.address}</p>}
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
            <a href={`tel:${contacts.phone}`} className="text-accent hover:text-accent-hover">
              {contacts.phone}
            </a>
          )}
          {contacts?.email && (
            <a href={`mailto:${contacts.email}`} className="text-bg/85 hover:text-accent">
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
                  className="text-bg/70 hover:text-accent capitalize text-sm"
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
