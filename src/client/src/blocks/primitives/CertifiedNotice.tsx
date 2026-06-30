import type { BlockNode, CertifiedNoticeBlockNode, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * CertifiedNotice — generic-блок сертификата с чек-листом критериев.
 *
 * @remarks
 * R5++ функциональное имя — заводчик ставит «Отборное разведение РКФ»,
 * автосервис «Авторизованный дилер», кофейня «SCA certified». Все тексты
 * берутся из CMS-полей блока (R0).
 *
 * Server Component (R14) — никаких client-side эффектов.
 */
type Data = Omit<CertifiedNoticeBlockNode, 'blockType' | 'id'>;

export function CertifiedNotice({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<Data> };
  readonly settings: SiteSettings;
}) {
  const { kicker, title, body, criteriaTitle, criteria } = node.data ?? {};
  const items = (criteria ?? []).filter((c) => c?.text?.trim());

  if (!kicker && !title && !body && items.length === 0) return null;

  const bodyParagraphs = (body ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="bg-bg pt-8 md:pt-12 pb-8 md:pb-12">
      {/* Без `ContentFrame decor="vines"` — блок имеет accent-bar (border-l 1.5px) как
          собственный декоративный акцент. Правило: лоза только когда нет своей линии. */}
      <div className="px-6">
        <article
          className={cn(
            'relative bg-paper rounded-[12px] overflow-hidden',
            'mx-auto max-w-[720px]',
            'pl-7 md:pl-10 pr-6 md:pr-10 py-8 md:py-10',
            'shadow-[0_6px_20px_rgba(43,34,26,0.08)]',
            'before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-accent before:rounded-r-[2px]',
          )}
        >
          {kicker && (
            <p className="font-sans uppercase tracking-[0.18em] text-[12px] md:text-[13px] font-bold text-accent-hover">
              {kicker}
            </p>
          )}
          {title && (
            <h3 className="mt-2 font-display italic text-[26px] md:text-[30px] leading-tight text-ink">
              {title}
            </h3>
          )}
          {bodyParagraphs.length > 0 && (
            <div className="mt-4 font-sans text-ink/85 text-[15px] md:text-base leading-relaxed">
              {bodyParagraphs.map((p, i) => (
                <p key={i} className={i > 0 ? 'mt-3' : undefined}>
                  {renderBoldMarks(p)}
                </p>
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div className="mt-6 md:mt-7">
              {criteriaTitle && (
                <p className="font-sans uppercase tracking-[0.14em] text-[11.5px] md:text-[12px] font-bold text-muted">
                  {criteriaTitle}
                </p>
              )}
              <ul className={cn('flex flex-col gap-2', criteriaTitle ? 'mt-3' : '')}>
                {items.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        'flex items-center justify-center shrink-0',
                        'h-5 w-5 rounded-full bg-accent/90 text-bg text-[11px] font-bold mt-0.5',
                      )}
                    >
                      ✓
                    </span>
                    <span className="font-sans text-ink text-[15px] md:text-base leading-snug">
                      {c.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

/**
 * Поддержка inline-bold через `**...**` в textarea-полях. Минимально, не markdown.
 */
function renderBoldMarks(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    const m = /^\*\*([^*]+)\*\*$/.exec(p);
    if (m) {
      return (
        <strong key={i} className="font-bold text-ink">
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{p}</span>;
  });
}
