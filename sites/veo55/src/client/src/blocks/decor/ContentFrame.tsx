import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * ContentFrame — **универсальный контейнер фрейминга секции**: единая ширина
 * контентной полосы (`max-w-content`) + опциональные декоративные границы
 * по сторонам.
 *
 * @remarks
 * **Зачем единый компонент (Holy Grail-уровень).** На любом сайте у всех
 * контентных секций контент живёт в одной и той же вертикальной полосе —
 * это даёт визуальный ритм и соосность боковых акцентов (декор-границы,
 * линия цитаты, край галереи) на одной вертикали.
 *
 * **`decor`** — какой декор по сторонам:
 *  - `lines` (по умолчанию) — тонкие полупрозрачные вертикали. Generic для
 *    любого сайта (CSS-класс `.hg-line-*` в `globals.css`).
 *  - `vines` — декоративные лозы из изображений. **Специфика veo55** —
 *    реализация в `globals.css → .hg-vine-*` использует veo55-CDN текстуры.
 *    На другом сайте либо не использовать, либо переопределить URL в
 *    переменных `--decor-vine-*`.
 *
 * **`side`** — с какой стороны рисовать декор. `none` = только полоса,
 * без декора (нужна когда у блока свои боковые акценты — линия цитаты,
 * край слайдера и т.п.).
 *
 * **Чистый wrapper.** Server Component (R14). Никакой логики.
 *
 * @example
 * ```tsx
 * <ContentFrame side="both" decor="vines">
 *   <Prose ... />
 * </ContentFrame>
 *
 * <ContentFrame side="none">
 *   <Quote ... />
 * </ContentFrame>
 *
 * // Generic сайт без veo55-лоз:
 * <ContentFrame side="both" decor="lines">
 *   <ArticleBody ... />
 * </ContentFrame>
 * ```
 */
export interface ContentFrameProps {
  /** С какой стороны рисовать декор. `none` — без декора, только полоса. */
  readonly side: 'left' | 'right' | 'both' | 'none';
  /** Вариант декора границ. `lines` (generic) или `vines` (veo55). */
  readonly decor?: 'lines' | 'vines';
  /**
   * Доп. классы. По умолчанию компонент центрирует контент `mx-auto` и
   * ограничивает по `max-w-content`. Можно перетереть через свой `max-w-*`.
   */
  readonly className?: string | undefined;
  readonly style?: CSSProperties | undefined;
  readonly children: ReactNode;
}

const DECOR_CLASS: Record<
  NonNullable<ContentFrameProps['decor']>,
  Record<ContentFrameProps['side'], string>
> = {
  lines: { left: 'hg-line-l', right: 'hg-line-r', both: 'hg-line', none: '' },
  vines: { left: 'hg-vine-l', right: 'hg-vine-r', both: 'hg-vine', none: '' },
};

export function ContentFrame({
  side,
  decor = 'lines',
  className,
  style,
  children,
}: ContentFrameProps) {
  return (
    <div className={cn('mx-auto max-w-content', DECOR_CLASS[decor][side], className)} style={style}>
      {children}
    </div>
  );
}
