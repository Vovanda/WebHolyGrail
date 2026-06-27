import type { BlockNode, SiteSettings } from 'contracts';

/**
 * ProjectTypesGrid (WHG-specific) — 2×2 grid типов проектов template'а.
 *
 * @remarks
 * Используется для самой страницы WHG-template'а — показывает Minimal /
 * Business Card / Blog / Portal как стартовые конфигурации одной архитектуры.
 * Downstream-сайты с одной нишей не используют этот блок.
 *
 * Composition: split 50/50 на desktop (заголовок+sub слева, grid справа),
 * на mobile — stack.
 */

export interface ProjectTypesGridData {
  readonly heading?: string;
  readonly subtitle?: string;
  readonly items?: readonly {
    readonly icon: string;
    readonly label: string;
    readonly description?: string;
    readonly status?: 'available' | 'roadmap';
  }[];
  readonly caption?: string;
}

export function ProjectTypesGrid({
  node,
}: {
  readonly node: BlockNode & { data?: ProjectTypesGridData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const headingRaw = data.heading ?? 'Одна архитектура.\nНесколько сценариев роста.';
  const subtitle = data.subtitle;
  const items = data.items ?? [];
  const caption = data.caption;

  // Heading может содержать перенос строк (\n) — split на lines. Если строк
  // больше 1 — последняя рендерится с accent-цветом (выделение акцента,
  // паттерн в духе Supabase / Resend "Build in a weekend / Scale to millions").
  const headingLines = headingRaw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-wide px-4 md:px-6 grid md:grid-cols-2 gap-10 md:gap-12 items-start">
        {/* LEFT — heading + subtitle */}
        <div>
          <h2 className="font-display text-h3 md:text-h2 font-semibold leading-tight text-ink">
            {headingLines.map((line, i) => (
              <span
                key={i}
                className={
                  i === headingLines.length - 1 && headingLines.length > 1
                    ? 'text-accent block'
                    : 'block'
                }
              >
                {line}
              </span>
            ))}
          </h2>
          {subtitle && <p className="mt-5 text-muted leading-relaxed max-w-md">{subtitle}</p>}
        </div>

        {/* RIGHT — 2×2 grid */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            {items.map((item, i) => {
              const isRoadmap = item.status === 'roadmap';
              return (
                <div
                  key={i}
                  className={`rounded-xl border bg-bg p-5 transition-shadow ${
                    isRoadmap
                      ? 'border-border opacity-70'
                      : 'border-border hover:shadow-md hover:border-accent/40'
                  }`}
                >
                  <span
                    className="grid h-9 w-9 place-items-center rounded-md bg-accent-soft text-accent text-lg mb-3"
                    aria-hidden="true"
                  >
                    {item.icon}
                  </span>
                  <div className="font-display font-semibold text-ink text-base">
                    {item.label}
                    {isRoadmap && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wide bg-surface text-muted border border-border">
                        soon
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <div className="text-sm text-muted mt-1 leading-snug">{item.description}</div>
                  )}
                </div>
              );
            })}
          </div>
          {caption && <p className="mt-5 text-center text-sm italic text-muted">{caption}</p>}
        </div>
      </div>
    </section>
  );
}
