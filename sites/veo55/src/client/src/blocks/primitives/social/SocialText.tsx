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
  dogMentions,
}: {
  readonly text: string;
  readonly mentions?: readonly SocialPostMention[];
  /**
   * Список наших собак — для auto-highlight кличек. Любое вхождение `name`
   * (case-insensitive) в тексте заменяется на dog-mention pill, клик по нему
   * откроет модалку `DogDetailDrawerRoot` через `data-detail-dialog={slug}`.
   */
  readonly dogMentions?: ReadonlyArray<{
    readonly slug: string;
    readonly names: ReadonlyArray<string>;
  }>;
}) {
  if (!text) return null;
  const allMentions = [...(mentions ?? []), ...detectDogMentions(text, dogMentions ?? [])];
  const nodes = renderText(text, allMentions);
  return <span className="whitespace-pre-wrap break-words">{nodes}</span>;
}

/**
 * Авто-детекция упоминаний наших собак в тексте.
 *
 * Каждая собака приходит как `{ slug, names: [полная-кличка, ...прозвища] }`.
 * Любое имя из `names` (case-insensitive, целое слово) → `SocialPostMention[type='dog']`
 * ведущая на `/dog/<slug>`. Aliases покрывают прозвища типа «Марта» для
 * «ОМСКАЯ ДРУЖИНА МАРТА» — иначе короткий вариант в посте не подсвечивается.
 *
 * Длинные имена ищутся первыми (чтобы «МАРС-АРЭС» матчился раньше «МАРС»).
 * `taken` защищает от двойного покрытия одной позиции разными именами.
 */
function detectDogMentions(
  text: string,
  dogs: ReadonlyArray<{ slug: string; names: ReadonlyArray<string> }>,
): SocialPostMention[] {
  if (dogs.length === 0 || !text) return [];
  // Разворачиваем все aliases в плоский список, чтобы единая сортировка
  // «длинные первыми» работала через все имена всех собак.
  const flat = dogs.flatMap((d) =>
    d.names
      .map((n) => (n ?? '').trim())
      .filter(Boolean)
      .map((name) => ({ slug: d.slug, name })),
  );
  flat.sort((a, b) => b.name.length - a.name.length);
  const found: SocialPostMention[] = [];
  const taken: Array<[number, number]> = [];
  for (const entry of flat) {
    const re = new RegExp(
      `(^|[^\\p{L}\\p{N}_])(${escapeRegex(entry.name)})(?=[^\\p{L}\\p{N}_]|$)`,
      'giu',
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const start = m.index + (m[1]?.length ?? 0);
      const end = start + (m[2]?.length ?? 0);
      if (taken.some(([s, e]) => start < e && end > s)) continue;
      taken.push([start, end]);
      found.push({
        type: 'dog',
        start,
        end,
        display: text.slice(start, end),
        url: `/dog/${entry.slug}`,
        data: { slug: entry.slug },
      } as unknown as SocialPostMention);
    }
  }
  return found;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    // Если auto-detect передал `slug` в `data.slug` — это наша собака,
    // подключаем DogDetailDrawer через `data-detail-dialog`. У server-side
    // dog-mentions (РКФ) только `dogId` — там просто ссылка наружу.
    const data = mention.data as { dogId?: number; slug?: string } | undefined;
    const ourSlug = data?.slug;
    return (
      <a
        href={mention.url}
        {...(ourSlug ? { 'data-detail-dialog': ourSlug } : {})}
        {...(data?.dogId ? { 'data-dog-id': String(data.dogId) } : {})}
        className="inline-flex items-center gap-1 px-2 py-px rounded-full font-semibold text-[13.5px] text-ink bg-[rgba(28,138,59,0.04)] border border-[rgba(28,138,59,0.16)] no-underline transition-colors hover:bg-[rgba(28,138,59,0.10)] hover:border-[rgba(28,138,59,0.35)] hover:text-[#1C8A3B] cursor-pointer"
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
