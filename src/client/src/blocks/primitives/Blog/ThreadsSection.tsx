import Link from 'next/link';
import type { BlockNode, BlogThreadSummary, ThreadsSectionData } from 'contracts';

import { listThreadSummaries } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { ThreadCard } from './ThreadCard';

/**
 * ThreadsSection — витрина серий внутри произвольной страницы.
 *
 * @remarks
 * Парный к `ArticlesSection`: тот показывает записи, этот — сами журналы.
 * Страница вида «Наши работы» до него собиралась из нескольких «Секций статей»,
 * по одной на объект, и каждый новый объект требовал правки страницы. Здесь
 * блок ставится один раз и подтягивает серии сам.
 *
 * Server-only (R14): выборка идёт на сервере, клиентского JS блок не добавляет.
 */
export interface ThreadsSectionProps {
  readonly node: BlockNode;
  readonly className?: string;
}

export async function ThreadsSection({ node, className }: ThreadsSectionProps) {
  const data = (node.data ?? {}) as unknown as ThreadsSectionData;

  const summaries = await fetchSummaries(data);
  const visible = data.hideEmpty === false ? summaries : summaries.filter(hasEntries);
  if (visible.length === 0) return null;

  const cta = data.cta?.href && data.cta.label ? data.cta : null;
  const list = data.layout === 'list';

  return (
    <section className={cn('mx-auto max-w-wide px-4 md:px-6 py-10 md:py-14', className)}>
      {/* Заголовок как у соседних секций страницы — витрина серий стоит в одном
          ряду с блоками услуг и ленты статей, и своя типографика её бы вырвала
          из ряда. */}
      {(data.title || data.description) && (
        <header className="mb-8 md:mb-10 text-center">
          {data.title && (
            <h2 className="font-display text-h3 md:text-h2 font-semibold text-ink">
              {cta ? (
                <Link href={cta.href!} className="hover:text-accent transition-colors">
                  {data.title}
                </Link>
              ) : (
                data.title
              )}
            </h2>
          )}
          {data.description && (
            <p className="text-muted mt-3 max-w-prose mx-auto">{data.description}</p>
          )}
        </header>
      )}

      <div
        className={cn(
          list
            ? 'flex flex-col gap-3'
            : // `auto-fit` вместо фиксированных трёх колонок: одна серия не
              // должна растягиваться на треть экрана с пустотой справа, а
              // четыре — сжиматься в нечитаемые полоски.
              'grid gap-5 md:gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]',
        )}
      >
        {visible.map(({ thread, articlesCount, lastPublishedAt }) => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            articlesCount={articlesCount}
            lastPublishedAt={lastPublishedAt}
            variant={list ? 'compact' : 'card'}
          />
        ))}
      </div>

      {cta && (
        <div className="mt-8 flex justify-center">
          <Link
            href={cta.href!}
            className="text-ink underline underline-offset-4 hover:text-muted transition-colors"
          >
            {cta.label}
          </Link>
        </div>
      )}
    </section>
  );
}

const hasEntries = (summary: BlogThreadSummary): boolean => summary.articlesCount > 0;

/** Выборка серий под выбранный источник. */
async function fetchSummaries(data: ThreadsSectionData): Promise<ReadonlyArray<BlogThreadSummary>> {
  if (data.source === 'manual') {
    const ids = (data.items ?? []).map((item) =>
      typeof item === 'object' && item !== null ? item.id : item,
    );
    if (ids.length === 0) return [];
    return listThreadSummaries({ ids });
  }

  return listThreadSummaries({ limit: data.limit ?? 12 });
}
