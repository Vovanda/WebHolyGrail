import type { SocialComment, SocialPostDoc } from 'contracts';

import { cn } from '@/lib/utils';

import { SocialText } from './SocialText';
import { SocialMediaGrid } from './SocialMediaGrid';
import { SocialComments } from './SocialComments';
import { CommentsToggleButton } from './CommentsToggleButton';
import { formatRelativeDate, formatCompactNumber } from './format';

/**
 * SocialPostCard — карточка одного социал-поста (VK / Telegram / IG).
 *
 * @remarks
 * Server Component (R14). Структура из legacy `news.html` + `news.php`:
 *
 *   ┌──────────────────────────────────────────────────┐
 *   │ [дата · автор]            Открыть в источнике ↗  │ header
 *   ├──────────────────────────────────────────────────┤
 *   │              [media grid n1..n6+]                │ media
 *   ├──────────────────────────────────────────────────┤
 *   │  Текст поста с mentions/hashtags/dog-links       │ text
 *   ├──────────────────────────────────────────────────┤
 *   │  ❤ 24    💬 8   🐾 2              👁 1.2k        │ meta
 *   ├──────────────────────────────────────────────────┤
 *   │  > Показать комментарии (8)                      │ comments
 *   └──────────────────────────────────────────────────┘
 *
 * Бренд veo55: paper-фон, border `--color-border`, radius 14px, hover-тень.
 * VK-link, hashtags, mentions через `SocialText`. Лайк/репост через
 * `SocialLikePopup` (popup tooltip с CTA в VK).
 */
export function SocialPostCard({
  post,
  comments,
  dogMentions,
  vkGroupUrl,
  sourceLabel,
}: {
  readonly post: SocialPostDoc;
  /** Server-side подгруженные комменты (если нужно SSR; пустой массив — без). */
  readonly comments?: readonly SocialComment[];
  /** Список наших собак — auto-highlight в тексте поста. */
  readonly dogMentions?: ReadonlyArray<{
    readonly slug: string;
    readonly names: ReadonlyArray<string>;
  }>;
  readonly vkGroupUrl: string;
  /** «Открыть в VK ↗» / «Открыть в TG ↗» — лейбл от источника. */
  readonly sourceLabel: string;
}) {
  const metrics = post.metrics;
  const media = post.media ?? [];

  return (
    <article
      data-post-id={post.id}
      className={cn(
        'bg-surface border border-border rounded-[14px] overflow-hidden flex flex-col',
        'transition-shadow duration-150 hover:shadow-[0_8px_24px_rgba(43,34,26,0.08)]',
      )}
    >
      {/* Header: дата + автор + ссылка на источник */}
      <header className="flex items-center justify-between gap-2.5 flex-wrap px-4 md:px-5 py-3 md:py-3.5 border-b border-[#f4ead7] text-[12.5px] text-muted">
        <span className="inline-flex items-center gap-2.5 flex-wrap">
          <span className="font-display italic text-[16px] md:text-[17px] tracking-[0.2px]">
            {formatRelativeDate(post.date)}
          </span>
          {post.author?.name && (
            <span className="inline-flex items-center gap-1.5 text-ink text-[12.5px] font-medium">
              {post.author.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.photo}
                  alt=""
                  loading="lazy"
                  className="w-[22px] h-[22px] rounded-full object-cover bg-border"
                />
              )}
              <span className="font-semibold">{post.author.name}</span>
            </span>
          )}
        </span>
        <a
          href={post.sourceUrl}
          target="_blank"
          rel="noopener"
          className="font-semibold text-ink underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness] text-[12.5px]"
        >
          {sourceLabel}
        </a>
      </header>

      {/* Media grid (если есть) */}
      {media.length > 0 && <SocialMediaGrid media={media} />}

      {/* Text */}
      {post.text && (
        <div className="px-4 md:px-5 py-3 md:py-3.5 text-ink text-[14.5px] md:text-[15.5px] leading-[1.65]">
          <SocialText text={post.text} mentions={post.mentions} dogMentions={dogMentions} />
        </div>
      )}

      {/* Meta: лайки/комменты/репосты/views */}
      <div className="flex items-center gap-4 md:gap-5 px-4 md:px-5 py-2.5 md:py-3 border-t border-[#f4ead7] text-[13.5px] text-muted">
        <button
          type="button"
          data-like-popup="like"
          className="inline-flex items-center gap-1.5 transition-transform hover:scale-110 cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
        >
          <span className="text-base">❤️</span>
          <strong className="text-ink font-semibold">{formatCompactNumber(metrics.likes)}</strong>
        </button>
        {metrics.comments > 0 ? (
          <CommentsToggleButton postId={String(post.id)} count={metrics.comments} />
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <span className="text-base">💬</span>
            <strong className="text-ink font-semibold">0</strong>
          </span>
        )}
        {metrics.reposts > 0 && (
          <button
            type="button"
            data-like-popup="repost"
            className="inline-flex items-center gap-1.5 transition-transform hover:scale-110 cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
          >
            <span className="text-base">🐾</span>
            <strong className="text-ink font-semibold">
              {formatCompactNumber(metrics.reposts)}
            </strong>
          </button>
        )}
        {metrics.views > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5">
            <span>👁</span>
            <span>{formatCompactNumber(metrics.views)}</span>
          </span>
        )}
      </div>

      {/* Comments lazy (раскрывается через summary или клик 💬-чипа в footer) */}
      {comments && comments.length > 0 && (
        <SocialComments
          postId={String(post.id)}
          comments={comments}
          postLikes={metrics.likes}
          totalCount={metrics.comments}
        />
      )}
    </article>
  );
}
