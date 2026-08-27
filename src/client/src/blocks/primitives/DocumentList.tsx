import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { resolveMediaUrl } from '@/lib/media';

/**
 * DocumentList — документы для скачивания.
 *
 * @remarks
 * Server-only (R14): ссылки на файлы, состояния нет.
 *
 * Плитка показывает первую страницу документа — превью собирается при загрузке
 * PDF, готовить картинку отдельно не нужно. Если превью нет (не PDF или рендер
 * не удался), плитка не ломается: остаётся заголовок с типом и размером файла.
 *
 * Размер подписан у каждой ссылки: человек на мобильном интернете должен
 * заранее понимать, во что ввязывается.
 */
export interface DocumentItem {
  readonly file?: MediaRef | null;
  readonly title?: string;
  readonly note?: string;
}

export interface DocumentListData {
  readonly heading?: string;
  readonly description?: string;
  readonly items?: readonly DocumentItem[];
  readonly layout?: 'cards' | 'list';
}

type MediaLike = {
  filename?: string;
  filesize?: number;
  mimeType?: string;
  preview?: unknown;
};

function humanSize(bytes: number | undefined): string | undefined {
  if (!bytes || bytes <= 0) return undefined;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(mb >= 10 ? 0 : 1)} МБ`;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

function kindOf(mime: string | undefined): string {
  if (!mime) return 'файл';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('image/')) return 'изображение';
  if (mime.startsWith('video/')) return 'видео';
  return mime.split('/').pop() ?? 'файл';
}

export function DocumentList({
  node,
}: {
  readonly node: BlockNode & { data?: DocumentListData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const items = (data.items ?? []).filter((item) => item.file);
  if (items.length === 0) return null;

  const asCards = (data.layout ?? 'cards') === 'cards';

  return (
    <section className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {data.heading && (
          <h2
            data-part="title"
            className="font-display text-2xl font-semibold text-ink md:text-3xl"
          >
            {data.heading}
          </h2>
        )}
        {data.description && (
          <p data-part="subtitle" className="mt-2 text-muted">
            {data.description}
          </p>
        )}

        <ul
          className={
            asCards
              ? 'mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'mt-6 divide-y divide-border border-y border-border'
          }
        >
          {items.map((item, index) => {
            const media = (typeof item.file === 'object' ? item.file : null) as MediaLike | null;
            const href = resolveMediaUrl(item.file);
            const title = item.title?.trim() || media?.filename || 'Документ';
            const meta = [kindOf(media?.mimeType), humanSize(media?.filesize)]
              .filter(Boolean)
              .join(' · ');
            const preview = resolveMediaUrl(media?.preview as MediaRef | null | undefined);

            if (!href) return null;

            if (!asCards) {
              return (
                <li key={index} data-part="item">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-baseline justify-between gap-4 py-3 no-underline transition-colors hover:text-accent"
                  >
                    <span className="text-ink">
                      {title}
                      {item.note && <span className="ml-2 text-sm text-muted">{item.note}</span>}
                    </span>
                    <span className="shrink-0 text-sm text-muted">{meta}</span>
                  </a>
                </li>
              );
            }

            return (
              <li key={index}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-part="card"
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface no-underline transition-colors hover:border-accent"
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element -- источник S3 нашей CMS
                    <img
                      data-part="card-media"
                      src={preview}
                      alt=""
                      aria-hidden="true"
                      className="aspect-[3/4] w-full border-b border-border object-cover object-top"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex aspect-[3/4] w-full items-center justify-center border-b border-border bg-accent-soft text-2xl font-semibold uppercase text-accent"
                    >
                      {kindOf(media?.mimeType)}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <span data-part="card-title" className="font-medium text-ink">
                      {title}
                    </span>
                    {item.note && (
                      <span data-part="card-subtitle" className="text-sm text-muted">
                        {item.note}
                      </span>
                    )}
                    <span data-part="card-caption" className="mt-auto pt-2 text-sm text-accent">
                      Скачать · {meta}
                    </span>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
