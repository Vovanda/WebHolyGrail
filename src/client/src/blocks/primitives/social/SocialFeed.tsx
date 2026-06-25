'use client';

import { useMemo, useState } from 'react';
import type { SocialComment, SocialFeedFilter, SocialPostDoc, SocialSource } from 'contracts';

import { cn } from '@/lib/utils';

import { SocialPostCard } from './SocialPostCard';

/**
 * SocialFeed — клиентский фид соц-постов с фильтр-чипами.
 *
 * @remarks
 * Фильтрация по периоду + сортировка по engagement делается на клиенте — все
 * посты уже загружены сервером (page.tsx). Это упрощает архитектуру и
 * избавляет от round-trip'ов при переключении чипов.
 *
 * Engagement = likes + comments + reposts + (views / 200) — небольшой буст
 * от просмотров (200:1 чтобы они не доминировали). Top-N в фильтрах
 * берётся именно по этой метрике.
 *
 * Фильтры (legacy `news.html → .veo-news__chip[data-filter]`):
 *  - `all`   → все за вычетом `hideLatest` свежих
 *  - `week`  → top-N за последние 7 дней
 *  - `month` → top-N за последние 30 дней
 *
 * Не делаем infinite scroll сейчас — F-этап. Простой статичный лист на N
 * постов с client filter переключением.
 */
export function SocialFeed({
  posts,
  commentsByPost,
  dogMentions,
  groupName,
  groupPhoto,
  groupUrl,
  groupMeUrl,
  config,
}: {
  readonly posts: readonly SocialPostDoc[];
  /**
   * Карта `postId → SocialComment[]` (flat-список с replies через `parentId`).
   * Заполняется в `SocialFeedServer` через `listCommentsForPosts`.
   */
  readonly commentsByPost?: Record<string, readonly SocialComment[]>;
  /** Список наших собак для auto-highlight в тексте постов. */
  readonly dogMentions?: ReadonlyArray<{
    readonly slug: string;
    readonly names: ReadonlyArray<string>;
  }>;
  readonly groupName: string;
  readonly groupPhoto?: string;
  readonly groupUrl: string;
  readonly groupMeUrl?: string;
  readonly config: {
    readonly sources: readonly SocialSource[];
    readonly count: number;
    readonly hideLatest: number;
    readonly showFilters: boolean;
    readonly weekTopN: number;
    readonly monthTopN: number;
    readonly hideTagRegex?: string;
  };
}) {
  const [filter, setFilter] = useState<SocialFeedFilter>('all');

  const visiblePosts = useMemo(
    () =>
      applyFilter(posts, filter, {
        weekTopN: config.weekTopN,
        monthTopN: config.monthTopN,
        hideLatest: config.hideLatest,
        hideTagRegex: config.hideTagRegex,
      }),
    [posts, filter, config],
  );

  return (
    <section className="bg-bg pt-10 md:pt-14 pb-12 md:pb-16">
      <div className="mx-auto max-w-[880px] px-4 md:px-6">
        <header className="text-center mb-7">
          <h1 className="font-display text-[clamp(32px,5vw,46px)] font-semibold text-ink leading-[1.1] tracking-[-0.6px] mb-2.5">
            Новости и события питомника
          </h1>
          <div className="mx-auto w-16 h-[1.5px] bg-accent opacity-85 rounded-full mb-3.5" />
          <p className="font-display italic text-[18px] text-muted m-0 tracking-[0.2px]">
            Свежие посты из нашего сообщества ВКонтакте
          </p>

          <div className="mt-[18px] flex items-center justify-between gap-3.5 flex-wrap-reverse sm:flex-row flex-col-reverse">
            {config.showFilters && (
              <nav
                role="tablist"
                aria-label="Фильтр ленты"
                className="inline-flex gap-1.5 flex-wrap items-center justify-center"
              >
                <FilterChip current={filter} value="all" onChange={setFilter}>
                  Все
                </FilterChip>
                <FilterChip
                  current={filter}
                  value="week"
                  onChange={setFilter}
                  title={`Топ-${config.weekTopN} за 7 дней по engagement`}
                >
                  🏆 За неделю
                </FilterChip>
                <FilterChip
                  current={filter}
                  value="month"
                  onChange={setFilter}
                  title={`Топ-${config.monthTopN} за 30 дней по engagement`}
                >
                  🏆 За месяц
                </FilterChip>
              </nav>
            )}

            <a
              href={groupUrl}
              target="_blank"
              rel="noopener"
              className={cn(
                'inline-flex items-center gap-2.5 pl-1.5 pr-[18px] py-1.5 self-center',
                'bg-surface border border-border rounded-full',
                'text-ink text-sm font-semibold no-underline',
                'transition-[transform,box-shadow,border-color] duration-150',
                'hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(43,34,26,0.10)] hover:border-accent',
              )}
            >
              {groupPhoto && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={groupPhoto}
                  alt={`Лого ${groupName}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span>
                {groupName} <span className="text-muted font-normal">в VK ↗</span>
              </span>
            </a>
          </div>
        </header>

        {visiblePosts.length === 0 ? (
          <div className="text-center py-16 px-5 text-muted font-display italic text-lg">
            <p>В этом периоде ничего не нашлось.</p>
            <p className="mt-3 text-[15px]">
              <a
                href={groupUrl}
                target="_blank"
                rel="noopener"
                className="underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness]"
              >
                Перейти в сообщество ВКонтакте ↗
              </a>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {visiblePosts.map((post) => {
              const postComments = commentsByPost?.[String(post.id)] ?? [];
              return (
                <SocialPostCard
                  key={post.id}
                  post={post}
                  comments={postComments}
                  dogMentions={dogMentions}
                  vkGroupUrl={groupUrl}
                  sourceLabel="Открыть в VK ↗"
                />
              );
            })}
          </div>
        )}

        {/* CTA-блок «Все новости в VK» */}
        <div className="mt-10 text-center p-8 px-6 bg-surface-hover rounded-[14px]">
          <p className="m-0 mb-4 font-display italic text-xl text-ink">
            Хотите больше новостей и общения?
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={groupUrl}
              target="_blank"
              rel="noopener"
              className={cn(
                'inline-flex items-center gap-2 min-h-[46px] px-[26px] py-3',
                'bg-[var(--color-vk)] hover:bg-[var(--color-vk-hover)] text-white rounded-full',
                'font-semibold text-[15px] no-underline',
                'shadow-[0_4px_12px_rgba(43,34,26,0.10)]',
                'transition-[transform,background-color,box-shadow] duration-150',
                'hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(43,34,26,0.14)]',
              )}
            >
              Все новости в нашем сообществе VK ↗
            </a>
            {groupMeUrl && (
              <a
                href={groupMeUrl}
                target="_blank"
                rel="noopener"
                className={cn(
                  'inline-flex items-center gap-2 min-h-[46px] px-[26px] py-3',
                  'bg-surface text-ink border-[1.5px] border-border rounded-full',
                  'font-semibold text-[15px] no-underline',
                  'transition-[transform,background-color,border-color] duration-150',
                  'hover:-translate-y-[1px] hover:bg-accent-soft hover:border-accent',
                )}
              >
                Написать нам в VK ✉
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterChip({
  current,
  value,
  onChange,
  children,
  title,
}: {
  readonly current: SocialFeedFilter;
  readonly value: SocialFeedFilter;
  readonly onChange: (v: SocialFeedFilter) => void;
  readonly children: React.ReactNode;
  readonly title?: string;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onChange(value)}
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 px-3.5 py-[7px] rounded-full',
        'text-[13px] font-semibold font-sans cursor-pointer',
        'border transition-[background-color,border-color,color] duration-150',
        active
          ? 'bg-ink border-ink text-bg hover:bg-[#3D352C]'
          : 'bg-surface border-border text-ink hover:bg-accent-soft hover:border-accent',
      )}
    >
      {children}
    </button>
  );
}

/**
 * Engagement-метрика: likes + comments + reposts + views/200.
 * Views/200 — лёгкий буст просмотров (без него likes-only лента, с ним
 * просмотры всё-таки чуть-чуть влияют на «топ»).
 */
function engagement(p: SocialPostDoc): number {
  return (
    p.metrics.likes + p.metrics.comments + p.metrics.reposts + Math.floor(p.metrics.views / 200)
  );
}

function applyFilter(
  posts: readonly SocialPostDoc[],
  filter: SocialFeedFilter,
  cfg: {
    weekTopN: number;
    monthTopN: number;
    hideLatest: number;
    hideTagRegex: string | undefined;
  },
): SocialPostDoc[] {
  // 1) Скрытие постов по тегу (например #эксклюзив).
  const re = cfg.hideTagRegex ? new RegExp(cfg.hideTagRegex, 'i') : null;
  let filtered = re ? posts.filter((p) => !re.test(p.text)) : [...posts];

  // 2) Сортировка по дате DESC.
  filtered = filtered.slice().sort((a, b) => b.date - a.date);

  const nowSec = Math.floor(Date.now() / 1000);

  if (filter === 'week') {
    const cutoff = nowSec - 7 * 86400;
    return filtered
      .filter((p) => p.date >= cutoff)
      .slice()
      .sort((a, b) => engagement(b) - engagement(a))
      .slice(0, cfg.weekTopN);
  }
  if (filter === 'month') {
    const cutoff = nowSec - 30 * 86400;
    return filtered
      .filter((p) => p.date >= cutoff)
      .slice()
      .sort((a, b) => engagement(b) - engagement(a))
      .slice(0, cfg.monthTopN);
  }

  // all: вычесть hideLatest свежих (retention в VK).
  return filtered.slice(cfg.hideLatest);
}
