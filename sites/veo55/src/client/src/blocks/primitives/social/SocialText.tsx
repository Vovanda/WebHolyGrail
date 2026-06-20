import type { SocialPostMention } from '@veo55/contracts';

/**
 * SocialText — рендер текста поста с inline-ссылками.
 *
 * @remarks
 * Логика 1:1 с legacy `news.html → vkTextToHtml` + `news.php → veo_text_to_html`:
 *
 *  1. Server-side mentions (резолвлены через РКФ/VK API) — приоритетны: их
 *     оборачиваем в `<a>` точно по `[start..end]`, esc'им части между.
 *  2. Полные URL `https?://…` → `<a href="…" target="_blank">…</a>`
 *  3. VK-mentions `[id123|name]` / `[club45|name]` → `https://vk.com/id123`
 *  4. Хэштеги `#tag` → VK feed search, **синие** (`#5181B8`) полужирные без подчёркивания
 *  5. Голые `vk.ru/com/me/foo` без https → ссылка с https://
 *  6. `\n` → `<br/>` (через `whitespace-pre-wrap`, не nl2br)
 *
 * Server component (R14). Возвращает массив React-нод; нужно вставить в JSX
 * с `whitespace-pre-wrap` контейнером (переносы строк).
 */
export function SocialText({
  text,
  mentions,
}: {
  readonly text: string;
  readonly mentions?: readonly SocialPostMention[];
}) {
  if (!text) return null;
  const nodes = renderText(text, mentions ?? []);
  return <span className="whitespace-pre-wrap break-words">{nodes}</span>;
}

/**
 * Разбивает текст на сегменты с учётом server-side mentions (по `[start..end]`),
 * затем каждый «plain» сегмент проходит через regex-пасс для URL/VK-mentions/
 * hashtags. Это избавляет от двойной обёртки: уже подтверждённая dog-mention
 * `[start..end]` не попадёт под URL-regex.
 */
function renderText(text: string, mentions: readonly SocialPostMention[]): React.ReactNode[] {
  const sorted = [...mentions].sort((a, b) => a.start - b.start);
  const out: React.ReactNode[] = [];
  let pos = 0;
  let key = 0;
  for (const m of sorted) {
    if (m.start < pos) continue;
    if (m.start > pos) {
      out.push(...applyInlineRegex(text.slice(pos, m.start), `seg-${key++}`));
    }
    out.push(<MentionLink key={`m-${key++}`} mention={m} />);
    pos = m.end;
  }
  if (pos < text.length) {
    out.push(...applyInlineRegex(text.slice(pos), `seg-${key++}`));
  }
  return out;
}

function MentionLink({ mention }: { readonly mention: SocialPostMention }) {
  // dog-mention имеет особый стиль — целлофановая «капсула» с зеленоватым фоном.
  // См. legacy news.html `.veo-post__text a.veo-dog-mention`.
  if (mention.type === 'dog') {
    return (
      <a
        href={mention.url}
        data-dog-id={(mention.data as { dogId?: number } | undefined)?.dogId ?? ''}
        className="inline-flex items-center gap-1 px-2 py-px rounded-full font-semibold text-[13.5px] text-ink bg-[rgba(28,138,59,0.04)] border border-[rgba(28,138,59,0.16)] no-underline transition-colors hover:bg-[rgba(28,138,59,0.08)] hover:border-[rgba(28,138,59,0.28)]"
      >
        🐾 {mention.display}
      </a>
    );
  }
  if (mention.type === 'hashtag') {
    return <HashtagLink href={mention.url}>{mention.display}</HashtagLink>;
  }
  // profile + url
  return (
    <a
      href={mention.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-ink underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness]"
    >
      {mention.display}
    </a>
  );
}

function HashtagLink({
  href,
  children,
}: {
  readonly href: string;
  readonly children: React.ReactNode;
}) {
  // Хэштеги в VK-стиле: синий полужирный без подчёркивания (#5181B8).
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-[#5181B8] hover:text-[#3D6FA3] no-underline hover:underline"
    >
      {children}
    </a>
  );
}

/**
 * Регэкспы для inline-обёртки: URL → ссылка, [id|name] → ссылка, #тег → ссылка.
 * Применяется к «чистым» сегментам (между уже резолвленными mentions).
 */
function applyInlineRegex(plain: string, keyBase: string): React.ReactNode[] {
  if (!plain) return [];
  // Порядок важен: URL первым (иначе #fragment в URL обернётся как hashtag).
  // Один проход через комбинированный regex с capture groups.
  const re =
    /(https?:\/\/[^\s<"]+)|(\[(?:id|club|public)(\d+)\|([^\]]+)\])|(#[\p{L}\p{N}_]+)|((?:^|[\s])(vk\.(?:ru|com|me)\/[^\s<"]+|t\.me\/[^\s<"]+))/gu;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let i = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(plain)) !== null) {
    if (match.index > lastIndex) {
      out.push(plain.slice(lastIndex, match.index));
    }
    const [, fullUrl, vkRef, vkId, vkName, hashtag, bareVkPrefix, bareVkUrl] = match;
    const k = `${keyBase}-${i++}`;
    if (fullUrl) {
      out.push(
        <a
          key={k}
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium text-ink underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness] break-all"
        >
          {fullUrl}
        </a>,
      );
    } else if (vkRef) {
      out.push(
        <a
          key={k}
          href={`https://vk.com/id${vkId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness]"
        >
          {vkName}
        </a>,
      );
    } else if (hashtag) {
      out.push(
        <HashtagLink
          key={k}
          href={`https://vk.com/feed?q=%23${encodeURIComponent(hashtag.slice(1))}`}
        >
          {hashtag}
        </HashtagLink>,
      );
    } else if (bareVkUrl) {
      out.push(bareVkPrefix);
      out.push(
        <a
          key={k}
          href={`https://${bareVkUrl}`}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="font-medium text-ink underline decoration-accent underline-offset-[3px] decoration-[1.5px] hover:decoration-[2px] transition-[text-decoration-thickness] break-all"
        >
          {bareVkUrl}
        </a>,
      );
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < plain.length) {
    out.push(plain.slice(lastIndex));
  }
  return out;
}
