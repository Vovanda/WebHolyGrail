import type { BlockNode, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { lexicalToInlineNodes } from '@/lib/lexical-text';
import { ContentFrame } from '@/blocks/decor/ContentFrame';

/**
 * AchievementBanner — generic плашка достижения / сертификации / награды.
 *
 * @remarks
 * **R5++ функциональное имя.** Переиспользуется на любом сайте:
 *  - Питомник: «РКФ Отборное Разведение» — 5 требований Приложения №7
 *  - Автосервис: «ISO 9001» — список аудитов
 *  - Кофейня: «Coffee Awards 2025» — критерии
 *  - Клиника: лицензии и категории врачей
 *
 * **Server Component (R14)** — все вычисления и парсинг markdown'а
 * на сервере, ничего динамического на клиенте.
 *
 * **markdown-light в `description`** — только `**bold**`, `*italic*` и
 * переносы строк. Без HTML, без XSS-риска. Если когда-то понадобится
 * полный RichText — выносим в отдельный блок, не сюда (R9).
 *
 * **Accent** — семантический цвет (amber/success/info/danger/neutral),
 * все оттенки через CSS-токены (R2). Чек-чипсы наследуют тот же accent.
 */
export interface AchievementBannerData {
  readonly icon?: string;
  readonly title?: string;
  readonly titleSuffix?: string;
  /** Lexical AST (Payload richText). Inline-форматирование (жирный, курсив) сохраняется. */
  readonly description?: unknown;
  readonly items?: ReadonlyArray<{ readonly text: string }>;
  readonly accent?: 'amber' | 'success' | 'info' | 'danger' | 'neutral';
}

export function AchievementBanner({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<AchievementBannerData> };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const icon = data.icon ?? '🏆';
  const title = data.title ?? '';
  const titleSuffix = data.titleSuffix;
  const descriptionNodes = lexicalToInlineNodes(data.description);
  const items = data.items ?? [];
  const accent = data.accent ?? 'amber';

  if (!title && descriptionNodes.length === 0 && items.length === 0) return null;

  const palette = ACCENT_PALETTE[accent];

  return (
    <section className="bg-bg pt-4 pb-4 md:pt-6 md:pb-6">
      <ContentFrame side="none" className="px-6">
        <div>
          <div
            className={cn(
              'flex items-center gap-[18px] px-[22px] py-[18px]',
              'rounded-[14px] border-2',
              palette.badgeBorder,
              palette.badgeBg,
              palette.badgeShadow,
            )}
          >
            <div
              aria-hidden
              className={cn('shrink-0 text-[42px] leading-none', palette.iconShadow)}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <p className="m-0 font-display font-bold text-[24px] uppercase text-ink tracking-[0.4px] leading-[1.1]">
                  {title}
                  {titleSuffix && (
                    <>
                      {' '}
                      <span className="font-medium italic text-[18px] text-muted normal-case tracking-[0.2px]">
                        {titleSuffix}
                      </span>
                    </>
                  )}
                </p>
              )}
              {descriptionNodes.length > 0 && (
                <p className="m-0 mt-1.5 text-[14.5px] leading-[1.5] text-ink">
                  {descriptionNodes}
                </p>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <ul
              aria-label="Чек-лист подтверждённых пунктов"
              className="list-none p-0 mt-2 mb-0 flex flex-wrap gap-x-[14px] gap-y-3 justify-center"
            >
              {items.map((it, i) => (
                <li
                  key={i}
                  className={cn(
                    'inline-flex items-center gap-2.5',
                    'pl-3.5 pr-5 py-[11px] rounded-full',
                    'border text-sm font-semibold tracking-[0.1px]',
                    palette.chipBg,
                    palette.chipBorder,
                    palette.chipText,
                    palette.chipShadow,
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'inline-flex items-center justify-center shrink-0',
                      'w-5 h-5 rounded-full text-bg',
                      'text-[12px] font-extrabold leading-none',
                      palette.chipCheckBg,
                    )}
                  >
                    ✓
                  </span>
                  {it.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </ContentFrame>
    </section>
  );
}

/**
 * Палитра по accent — все классы через CSS-токены (R2). Никаких hex.
 * Чек-чипсы наследуют тот же accent: если плашка amber — чипсы тоже amber.
 */
const ACCENT_PALETTE: Record<
  NonNullable<AchievementBannerData['accent']>,
  {
    badgeBg: string;
    badgeBorder: string;
    badgeShadow: string;
    iconShadow: string;
    chipBg: string;
    chipBorder: string;
    chipText: string;
    chipCheckBg: string;
    chipShadow: string;
  }
> = {
  amber: {
    badgeBg: 'bg-gradient-to-br from-accent-soft to-[#F7E29F]',
    badgeBorder: 'border-accent',
    badgeShadow: 'shadow-[0_6px_22px_rgba(168,128,42,0.18)]',
    iconShadow: 'drop-shadow-[0_2px_4px_rgba(168,128,42,0.3)]',
    chipBg: 'bg-success-soft',
    chipBorder: 'border-success',
    chipText: 'text-success',
    chipCheckBg: 'bg-success',
    chipShadow: 'shadow-[0_1px_3px_rgba(28,138,59,0.06)]',
  },
  success: {
    badgeBg: 'bg-success-soft',
    badgeBorder: 'border-success',
    badgeShadow: 'shadow-[0_6px_22px_rgba(28,138,59,0.18)]',
    iconShadow: 'drop-shadow-[0_2px_4px_rgba(28,138,59,0.3)]',
    chipBg: 'bg-success-soft',
    chipBorder: 'border-success',
    chipText: 'text-success',
    chipCheckBg: 'bg-success',
    chipShadow: 'shadow-[0_1px_3px_rgba(28,138,59,0.06)]',
  },
  info: {
    badgeBg: 'bg-[color:rgb(232_242_255)]',
    badgeBorder: 'border-vk',
    badgeShadow: 'shadow-[0_6px_22px_rgba(0,119,255,0.18)]',
    iconShadow: 'drop-shadow-[0_2px_4px_rgba(0,119,255,0.3)]',
    chipBg: 'bg-[color:rgb(232_242_255)]',
    chipBorder: 'border-vk',
    chipText: 'text-vk',
    chipCheckBg: 'bg-vk',
    chipShadow: 'shadow-[0_1px_3px_rgba(0,119,255,0.08)]',
  },
  danger: {
    badgeBg: 'bg-[color:rgb(254_237_237)]',
    badgeBorder: 'border-danger',
    badgeShadow: 'shadow-[0_6px_22px_rgba(181,72,72,0.18)]',
    iconShadow: 'drop-shadow-[0_2px_4px_rgba(181,72,72,0.3)]',
    chipBg: 'bg-[color:rgb(254_237_237)]',
    chipBorder: 'border-danger',
    chipText: 'text-danger',
    chipCheckBg: 'bg-danger',
    chipShadow: 'shadow-[0_1px_3px_rgba(181,72,72,0.08)]',
  },
  neutral: {
    badgeBg: 'bg-surface',
    badgeBorder: 'border-border',
    badgeShadow: 'shadow-[0_6px_22px_rgba(43,34,26,0.10)]',
    iconShadow: 'drop-shadow-[0_2px_4px_rgba(43,34,26,0.2)]',
    chipBg: 'bg-surface',
    chipBorder: 'border-border',
    chipText: 'text-ink',
    chipCheckBg: 'bg-ink',
    chipShadow: 'shadow-[0_1px_3px_rgba(43,34,26,0.06)]',
  },
};
