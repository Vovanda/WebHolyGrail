import type { BlogThread } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * ThreadCard — карточка серии (журнала записей). Click → /blog/thread/<slug>.
 *
 * @remarks
 * Серия для читателя — это объект или тема, а не «серия»: журнал работ по дому,
 * дневник ремонта, части лонгрида. Поэтому надпись «Серия» на карточке не
 * пишется: она сообщает название сущности из админки вместо того, что читателю
 * полезно. Вместо неё — состав журнала («5 записей») и свежесть («последняя 26
 * августа»), то есть ровно то, по чему выбирают, открывать ли.
 *
 * Варианты:
 *  - `hero`    — шапка страницы серии: обложка, заголовок, описание, состав
 *  - `card`    — плитка для витрины объектов
 *  - `compact` — строка-ссылка (sidebar, «из той же серии»)
 */
export interface ThreadCardProps {
  readonly thread: BlogThread;
  readonly articlesCount?: number;
  /** Дата последней записи — показывает, что журнал живой. */
  readonly lastPublishedAt?: string | null;
  readonly variant?: 'card' | 'hero' | 'compact';
  /** Уровень заголовка: на странице серии он единственный h1, в витрине — h3. */
  readonly headingLevel?: 'h1' | 'h2' | 'h3';
  readonly className?: string;
}

export function ThreadCard({
  thread,
  articlesCount,
  lastPublishedAt,
  variant = 'card',
  headingLevel,
  className,
}: ThreadCardProps) {
  const href = `/blog/thread/${thread.slug}`;
  const meta = threadMeta(articlesCount, lastPublishedAt);

  if (variant === 'hero') {
    const Heading = headingLevel ?? 'h1';
    const cover = thread.cover;
    return (
      <section
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-surface',
          cover?.url && 'md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-stretch',
          className,
        )}
      >
        {cover?.url && (
          <img
            src={cover.url}
            alt={cover.alt ?? thread.title}
            className="w-full aspect-[16/10] object-cover md:h-full md:aspect-auto"
            loading="eager"
          />
        )}
        <div className="flex flex-col justify-center gap-3 p-6 md:p-8 lg:p-10">
          <Heading className="text-h2 font-display font-semibold text-ink leading-tight tracking-tight text-balance">
            {thread.title}
          </Heading>
          {thread.description && (
            <p className="text-body text-muted leading-relaxed max-w-prose">{thread.description}</p>
          )}
          {meta && <p className="text-sm text-muted/80 tabular-nums">{meta}</p>}
        </div>
      </section>
    );
  }

  if (variant === 'compact') {
    return (
      <a
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-md border border-border px-3 py-2.5',
          'hover:border-border-strong hover:bg-surface-hover transition-colors',
          className,
        )}
      >
        <span className="min-w-0 truncate font-semibold text-ink">{thread.title}</span>
        {articlesCount !== undefined && (
          <span className="ml-auto shrink-0 text-xs text-muted tabular-nums">{articlesCount}</span>
        )}
      </a>
    );
  }

  // default = card — плитка витрины: обложка, название, описание, состав журнала.
  const Heading = headingLevel ?? 'h3';
  return (
    <article
      className={cn(
        // `relative` — якорь для растянутой ссылки заголовка (см. ниже).
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-paper',
        'transition-colors hover:border-border-strong',
        'focus-within:border-border-strong focus-within:ring-2 focus-within:ring-accent/40',
        className,
      )}
    >
      <div className="overflow-hidden bg-surface">
        {thread.cover?.url ? (
          <img
            src={thread.cover.url}
            alt={thread.cover.alt ?? thread.title}
            className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          // Без обложки плитка не должна схлопываться: сетка поедет, и карточки
          // с фото рядом с карточками без фото встанут разной высоты.
          <div className="w-full aspect-[4/3]" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 md:p-5">
        <Heading className="text-h4 font-display font-semibold text-ink leading-snug text-balance">
          {/*
            Кликается вся плитка, а не только заголовок: карточка целиком
            выглядит как одна кнопка, и попадание мимо буквы заголовка
            воспринимается как поломка. Растянутый псевдоэлемент вместо
            обёртки-ссылки — чтобы в разметке остался один осмысленный якорь
            (обложка и описание не дублируют его для скринридера), а текст
            карточки можно было выделить мышью.
          */}
          <a
            href={href}
            className="after:absolute after:inset-0 after:content-[''] group-hover:underline underline-offset-4 decoration-1 focus-visible:outline-none"
          >
            {thread.title}
          </a>
        </Heading>
        {thread.description && (
          <p className="text-body text-muted line-clamp-2 leading-relaxed">{thread.description}</p>
        )}
        {meta && <p className="mt-auto pt-1 text-sm text-muted/80 tabular-nums">{meta}</p>}
      </div>
    </article>
  );
}

/** «5 записей · последняя 26 августа» — состав журнала одной строкой. */
function threadMeta(count?: number, lastPublishedAt?: string | null): string | null {
  const parts: string[] = [];
  if (count !== undefined && count > 0) {
    parts.push(`${count} ${pluralize(count, 'запись', 'записи', 'записей')}`);
  }
  if (lastPublishedAt) {
    const date = new Date(lastPublishedAt);
    if (!Number.isNaN(date.getTime())) {
      parts.push(
        `последняя ${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`,
      );
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
