import type { SocialComment, SocialPostMention } from '@veo55/contracts';

import { cn } from '@/lib/utils';

import { SocialText } from './SocialText';
import { formatRelativeDate, formatCompactNumber } from './format';

/**
 * SocialComments — список комментов поста с lazy-открытием.
 *
 * @remarks
 * UX-пороги 1:1 с legacy `news.php`:
 *  - `< 85 likes` (p25)  → `<details>` закрыт, контент в DOM для SEO
 *  - `85-195` (медиана)  → `<details>` open, первые 3 + кнопка «Показать все»
 *  - `>= 196` (p75)      → `<details>` open, все видны сразу
 *
 * Ветки `replies` — рекурсивно, отступ слева через `border-l accent-soft`.
 * Аватарка имени — если есть `photo`, иначе плейсхолдер из инициалов.
 */
export function SocialComments({
  postId,
  comments,
  postLikes,
  totalCount,
}: {
  /** Используется для связи с CommentsToggleButton в footer'е (клик 💬). */
  readonly postId?: string;
  readonly comments: readonly SocialComment[];
  readonly postLikes: number;
  readonly totalCount?: number;
}) {
  if (comments.length === 0) return null;

  // Top-level комменты (parentId='0') — это видимые карточки. Replies
  // прикрепляются рекурсивно при рендере (см. CommentRow).
  // ВАЖНО: `parentId` коммента-ответа = `sourceId` РОДИТЕЛЯ (VK API хранит
  // ссылки между комментами через source-id, не через наш Payload-id).
  // Группируем по `sourceId`, не `id`.
  const topLevel = comments.filter((c) => !c.parentId || c.parentId === '0');
  const repliesByParent = new Map<string, SocialComment[]>();
  for (const c of comments) {
    if (c.parentId && c.parentId !== '0') {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }
  const enriched: SocialComment[] = topLevel.map((c) => ({
    ...c,
    replies:
      c.replies && c.replies.length > 0
        ? c.replies
        : c.sourceId
          ? (repliesByParent.get(c.sourceId) ?? [])
          : [],
  }));

  const open = postLikes >= 85;
  const showAll = postLikes >= 196;
  const visibleN = showAll ? enriched.length : 3;
  const visible = enriched.slice(0, visibleN);
  const rest = enriched.slice(visibleN);
  const totalLabel = formatCompactNumber(totalCount ?? enriched.length);

  return (
    <details
      data-comments-of={postId}
      className={cn(
        'border-t border-[#f4ead7] bg-[#FDFCF8]',
        '[&>summary]:list-none [&>summary::-webkit-details-marker]:hidden',
        'group',
      )}
      open={open || undefined}
    >
      <summary className="flex items-center gap-1.5 cursor-pointer select-none px-4 py-2.5 text-[13px] text-muted font-semibold hover:text-ink">
        <span
          aria-hidden
          className="text-lg leading-none transition-transform group-open:rotate-90"
        >
          ›
        </span>
        Показать комментарии ({totalLabel})
      </summary>
      <div className="px-3.5 pb-3.5 pt-2 flex flex-col gap-3.5">
        {visible.map((c) => (
          <CommentRow key={c.id} c={c} isReply={false} />
        ))}
        {rest.length > 0 && <ShowMoreComments rest={rest} />}
      </div>
    </details>
  );
}

function ShowMoreComments({ rest }: { readonly rest: readonly SocialComment[] }) {
  // Серверный компонент рендерит rest скрытыми через `is-hidden` (display:none)
  // и кнопку «Показать все». Кнопка с client onClick — но мы не делаем client
  // wrapper ради этого, переписываем через CSS-only `<details>` внутри
  // `<details>` нельзя — поэтому используем простую `<details>` без summary.
  // Лучше — отдельный client-компонент-аккордеон.
  return <ShowMoreClient rest={rest} />;
}

// === Client-аккордеон для остатка комментов ===
function ShowMoreClient({ rest }: { readonly rest: readonly SocialComment[] }) {
  return (
    <ClientToggle restCount={rest.length}>
      <div className="flex flex-col gap-3.5">
        {rest.map((c) => (
          <CommentRow key={c.id} c={c} isReply={false} />
        ))}
      </div>
    </ClientToggle>
  );
}

function ClientToggle({
  restCount,
  children,
}: {
  readonly restCount: number;
  readonly children: React.ReactNode;
}) {
  // Используем native <details> без summary text — раскрывается кнопкой-summary.
  return (
    <details className="[&>summary]:list-none [&>summary::-webkit-details-marker]:hidden group/more">
      <summary className="self-start cursor-pointer text-[13px] font-semibold text-ink underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness] py-1.5 px-2.5 rounded-md hover:bg-accent-soft group-open/more:hidden">
        Показать все ({restCount})
      </summary>
      {children}
    </details>
  );
}

function CommentRow({ c, isReply }: { readonly c: SocialComment; readonly isReply: boolean }) {
  const photo = c.author?.photo;
  const date = formatRelativeDate(c.date);
  const avatarSize = isReply ? 'w-[30px] h-[30px]' : 'w-9 h-9';
  return (
    <div
      className={cn(
        'flex gap-2.5 items-start',
        // Тонкий top-divider между соседними комментами уровня (legacy:
        // `.veo-post__comments-list > .veo-cm + .veo-cm::before`).
        'first:pt-0 [&:not(:first-child)]:relative [&:not(:first-child)]:pt-3.5',
        '[&:not(:first-child)]:before:content-[""] [&:not(:first-child)]:before:absolute',
        '[&:not(:first-child)]:before:left-0 [&:not(:first-child)]:before:right-0 [&:not(:first-child)]:before:top-0 [&:not(:first-child)]:before:h-px',
        '[&:not(:first-child)]:before:bg-[rgba(43,34,26,0.08)]',
      )}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt=""
          loading="lazy"
          className={cn('rounded-full shrink-0 bg-border object-cover block', avatarSize)}
        />
      ) : (
        <span className={cn('rounded-full shrink-0 bg-border block', avatarSize)} aria-hidden />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap text-[12.5px] text-muted mb-0.5">
          <span className="font-semibold text-ink text-[13px]">{c.author.name}</span>
          <span className="font-display italic text-[13px]">{date}</span>
          {c.likes > 0 && (
            <button
              type="button"
              data-like-popup="like"
              className="ml-auto inline-flex items-center gap-1 text-xs bg-transparent border-0 p-0 cursor-pointer transition-transform hover:scale-110"
            >
              <span>❤️</span>
              <span>{formatCompactNumber(c.likes)}</span>
            </button>
          )}
        </div>
        {c.text && (
          <div className={cn('text-ink leading-snug', isReply ? 'text-[13.5px]' : 'text-sm')}>
            <SocialText
              text={c.text}
              mentions={undefined as readonly SocialPostMention[] | undefined}
            />
          </div>
        )}
        {c.replies && c.replies.length > 0 && (
          <div className="mt-2.5 pl-3.5 border-l-2 border-border flex flex-col gap-2.5">
            {c.replies.map((r) => (
              <CommentRow key={r.id} c={r} isReply={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
