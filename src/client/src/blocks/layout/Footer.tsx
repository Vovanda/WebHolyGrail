import Link from 'next/link';
import { Github } from 'lucide-react';
import type { BlockNode, SiteSettings } from 'contracts';

/**
 * Footer — минималистичный нижний слой template'а.
 *
 * @remarks
 * 3-колоночный grid (wordmark+desc / Документация / Проект) + bottom-bar
 * с copy и license. Цвета через токены (адаптируется к light/dark).
 *
 * Опциональные поля из `node.data`:
 *   - `githubUrl?: string` — ссылка на GitHub репо для иконки в bottom-bar
 *   - `tagline?: string` — короткая строка под wordmark (1 предложение)
 *   - `docsLinks?: { label, href }[]` — кастомные ссылки в колонку "Документация"
 *   - `projectLinks?: { label, href }[]` — кастомные ссылки в колонку "Проект"
 *
 * Если data-поля не заданы — используются дефолты (GitHub-ссылка WHG repo,
 * docs/issues/discussions/changelog).
 */

export interface FooterData {
  readonly githubUrl?: string;
  readonly tagline?: string;
  readonly docsLinks?: readonly { readonly label: string; readonly href: string }[];
  readonly projectLinks?: readonly { readonly label: string; readonly href: string }[];
}

export function Footer({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: FooterData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const siteName = settings.siteName ?? 'Web Holy Grail';
  const githubUrl = data.githubUrl;
  const tagline = data.tagline;
  const docs = data.docsLinks ?? [];
  const project = data.projectLinks ?? [];
  const year = new Date().getFullYear();

  const hasDocs = docs.length > 0;
  const hasProject = project.length > 0;
  const columns = 1 + (hasDocs ? 1 : 0) + (hasProject ? 1 : 0);

  return (
    <footer className="border-t border-border bg-page-bg text-ink">
      <div
        className={[
          'mx-auto max-w-wide px-4 md:px-6 py-10 md:py-14 grid gap-8 md:gap-12 grid-cols-1 sm:grid-cols-2',
          columns === 3 ? 'md:grid-cols-3' : columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1',
        ].join(' ')}
      >
        {/* Col 1 — wordmark + tagline */}
        <div>
          <div className="font-display text-lg font-semibold text-ink">{siteName}</div>
          {tagline && <p className="mt-3 text-sm text-muted leading-relaxed max-w-xs">{tagline}</p>}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${siteName} on GitHub`}
              className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted hover:text-ink hover:bg-surface transition-colors"
            >
              <Github size={16} />
            </a>
          )}
        </div>

        {/* Col 2 — Документация (если есть) */}
        {hasDocs && (
          <nav>
            <div className="font-display font-semibold text-ink text-sm mb-3">Документация</div>
            <ul className="space-y-2">
              {docs.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Col 3 — Проект (если есть) */}
        {hasProject && (
          <nav>
            <div className="font-display font-semibold text-ink text-sm mb-3">Проект</div>
            <ul className="space-y-2">
              {project.map((item) => (
                <li key={item.href}>
                  <FooterLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-wide px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div>
            © {year} {siteName} · MIT License
          </div>
          <div>Built on Web Holy Grail</div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { readonly href: string; readonly label: string }) {
  const external = href.startsWith('http');
  return (
    <Link
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="text-sm text-muted hover:text-ink transition-colors"
    >
      {label}
    </Link>
  );
}
