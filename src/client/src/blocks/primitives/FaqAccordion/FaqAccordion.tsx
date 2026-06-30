import type { BlockNode, FaqAccordionBlockData, FaqGroupDoc, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';
import { listFaqGroups } from '@/lib/api-client';
import { FaqToggleAllButtons } from '@/blocks/primitives/FaqAccordion/FaqToggleAllButtons';

/**
 * FaqAccordion — рендер списка FAQ-групп с аккордеоном.
 *
 * @remarks
 * **Server Component (R14).** Тянет группы через Payload Local API REST
 * (`/api/faq-groups`), сортирует по `order`. Если в блоке задан фильтр
 * `groups` — рендерит только их.
 *
 * **Generic.** Не привязан к бизнес-домену — заголовок/лид/CTA приходят
 * данными, контент — из отдельной коллекции.
 *
 * **Дизайн:**
 *  - h1 + emoji + акцентная подчёрта-divider
 *  - лид курсивом (Cormorant Garamond)
 *  - chips-нумерация секций сверху (быстрый jump через `#<slug>`)
 *  - аккордеон `<details>` с `+` плюсиком (поворачивается)
 *  - CTA-блок снизу (опционально)
 *
 * Accordion на чистом `<details>/<summary>` — без JS, SSR-friendly.
 */
export async function FaqAccordion({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<FaqAccordionBlockData> };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const allGroups = await listFaqGroups().catch(() => [] as FaqGroupDoc[]);
  const filterIds = (data.groups ?? [])
    .map((g) => (typeof g === 'object' && g ? g.id : g))
    .filter((id): id is string | number => id != null);
  const groups =
    filterIds.length > 0 ? allGroups.filter((g) => filterIds.includes(g.id)) : allGroups;

  if (groups.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[FaqAccordion] нет опубликованных групп FAQ (pnpm seed:faq или /admin/collections/faq-groups)',
      );
    }
    return null;
  }

  const title = data.title ?? '';
  const titleEmoji = data.titleEmoji ?? '🐾';
  const lead = data.lead;
  const showChips = data.showChips !== false;
  const cta = data.cta;

  return (
    <section className="bg-bg py-8 md:py-12">
      <div className="mx-auto max-w-[880px] px-4 md:px-6">
        <h1 className="font-display font-semibold text-center leading-tight text-[clamp(30px,5vw,46px)] text-ink m-0 tracking-[-0.6px]">
          {titleEmoji && <span className="mr-2">{titleEmoji}</span>}
          {title}
        </h1>
        <div className="mx-auto mt-3.5 h-[1.5px] w-[60px] bg-accent opacity-85 rounded-full" />

        {lead && (
          <p className="font-display italic text-center text-[18px] leading-[1.5] text-muted mt-6 mb-[26px] tracking-[0.2px]">
            {lead}
          </p>
        )}

        <FaqToggleAllButtons />

        {showChips && groups.length > 1 && (
          <nav
            aria-label="Быстрый переход к разделам"
            className="flex flex-wrap gap-2 justify-center mb-6"
          >
            {groups.map((g, i) => (
              <a
                key={g.id}
                href={`#faq-${slugFor(g, i)}`}
                className={cn(
                  'inline-flex items-center gap-1.5 min-h-9 px-3.5 py-2',
                  'bg-surface text-ink rounded-full text-[13px] font-semibold no-underline',
                  'border border-border transition-colors duration-150 transition-transform',
                  'hover:bg-surface-hover hover:-translate-y-px',
                )}
              >
                <span className="text-[14px] text-paper bg-ink rounded-full px-2.5 py-0.5 font-extrabold tracking-[0.3px]">
                  {i + 1}
                </span>
                {g.emoji && <span>{g.emoji}</span>}
                <span>{g.title}</span>
              </a>
            ))}
          </nav>
        )}

        {groups.map((g, i) => (
          <section key={g.id} id={`faq-${slugFor(g, i)}`} className="my-5">
            <h2 className="flex items-center gap-2.5 font-bold text-ink m-0 mb-2.5 pb-1.5 border-b-[1.5px] border-border uppercase tracking-[0.5px] text-[16px]">
              <span className="inline-flex items-center justify-center w-[30px] h-[30px] bg-ink text-paper rounded-full text-[15px] font-extrabold">
                {i + 1}
              </span>
              {g.emoji && <span>{g.emoji}</span>}
              <span>{g.title}</span>
            </h2>
            {g.items.map((it, j) => (
              <details
                key={j}
                data-faq-item
                {...(it.openByDefault ? { open: true } : {})}
                className={cn(
                  'group bg-paper border border-border rounded-[12px] mb-2.5',
                  'transition-shadow duration-150 hover:shadow-sm',
                  // Когда открыт — мягкая подложка surface + success-рамка
                  'open:bg-surface open:border-success',
                )}
              >
                <summary
                  className={cn(
                    'flex items-center gap-3 px-4 py-3.5 min-h-12 cursor-pointer list-none',
                    'text-ink text-[15px] leading-[1.35] select-none',
                    'font-semibold group-open:font-bold',
                  )}
                >
                  {/* Closed: янтарный + ; Open: зелёный ✓. Через CSS-варианты,
                      без JS — две иконки, скрываем нерелевантную. */}
                  <span
                    aria-hidden
                    className={cn(
                      'inline-flex items-center justify-center shrink-0',
                      'w-7 h-7 rounded-full text-[18px] font-bold leading-none',
                      'bg-accent text-paper',
                      'group-open:hidden',
                    )}
                  >
                    +
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      'hidden group-open:inline-flex items-center justify-center shrink-0',
                      'w-7 h-7 rounded-full text-[14px] font-extrabold leading-none',
                      'bg-success text-paper',
                    )}
                  >
                    ✓
                  </span>
                  <span className="flex-1">{it.question}</span>
                </summary>
                <div className="px-4 pb-4 pt-1 text-ink text-[15px] leading-[1.55]">
                  <FaqAnswer content={it.answer} />
                </div>
              </details>
            ))}
          </section>
        ))}

        {cta && (cta.text || cta.linkLabel) && (
          <div className="mt-8 text-center">
            {cta.text && <p className="text-muted text-[15px] mb-3">{cta.text}</p>}
            {cta.linkLabel && cta.linkHref && (
              <a
                href={cta.linkHref}
                target="_blank"
                rel="noopener"
                className={cn(
                  'inline-flex items-center gap-2 min-h-[46px] px-6 py-3',
                  // VK-link → синий бренд VK, иначе primary accent.
                  isVkUrl(cta.linkHref)
                    ? 'bg-vk hover:bg-vk-hover'
                    : 'bg-accent hover:bg-accent-hover',
                  'text-paper rounded-full font-bold text-[15px] no-underline',
                  'transition-colors duration-150',
                )}
              >
                {cta.linkLabel}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function slugFor(g: FaqGroupDoc, i: number): string {
  return g.slug?.trim() || String(i + 1);
}

function isVkUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return /(?:^|\.)vk\.(?:com|me|ru)$/i.test(u.hostname);
  } catch {
    return /vk\.(com|me|ru)/i.test(href);
  }
}

// Lexical AST → React. Минимальный набор узлов для FAQ: paragraph, list (ul/ol),
// listitem, text (с bold), link. Без подключения @lexical/react — оверкилл.
interface LexNode {
  readonly type: string;
  readonly children?: ReadonlyArray<LexNode>;
  readonly text?: string;
  readonly format?: number; // bitmask: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code
  readonly tag?: string;
  readonly listType?: 'bullet' | 'number';
  readonly url?: string;
}

function FaqAnswer({ content }: { readonly content: unknown }) {
  const root = (content as { root?: LexNode } | null)?.root;
  if (!root?.children?.length) return null;
  return <div className="faq-answer flex flex-col gap-2.5">{root.children.map(renderLex)}</div>;
}

function renderLex(node: LexNode, i: number): React.ReactNode {
  if (node.type === 'paragraph') {
    return (
      <p key={i} className="m-0 leading-[1.55]">
        {(node.children ?? []).map(renderLex)}
      </p>
    );
  }
  if (node.type === 'list') {
    const Tag = node.listType === 'number' ? 'ol' : 'ul';
    return (
      <Tag
        key={i}
        className={cn(
          'pl-6 m-0 flex flex-col gap-1.5',
          node.listType === 'number' ? 'list-decimal' : 'list-disc',
        )}
      >
        {(node.children ?? []).map(renderLex)}
      </Tag>
    );
  }
  if (node.type === 'listitem') {
    return <li key={i}>{(node.children ?? []).map(renderLex)}</li>;
  }
  if (node.type === 'link') {
    return (
      <a
        key={i}
        href={node.url ?? '#'}
        target="_blank"
        rel="noopener"
        className="text-accent underline hover:text-accent-hover hover:no-underline"
      >
        {(node.children ?? []).map(renderLex)}
      </a>
    );
  }
  if (node.type === 'text') {
    const bold = (node.format ?? 0) & 1;
    const italic = (node.format ?? 0) & 2;
    const text = node.text ?? '';
    if (bold && italic)
      return (
        <strong key={i}>
          <em>{text}</em>
        </strong>
      );
    if (bold) return <strong key={i}>{text}</strong>;
    if (italic) return <em key={i}>{text}</em>;
    return <span key={i}>{text}</span>;
  }
  return null;
}
