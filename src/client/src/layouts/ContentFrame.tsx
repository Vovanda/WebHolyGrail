import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * ContentFrame — **универсальный контейнер фрейминга секции**: единая ширина
 * контентной полосы (`max-w-content`) + опциональные декоративные границы
 * по сторонам.
 *
 * @remarks
 * ## Зачем единый компонент (Holy Grail-уровень)
 *
 * На любом сайте у всех контентных секций контент живёт в одной и той же
 * вертикальной полосе — это даёт визуальный ритм и соосность боковых
 * акцентов (декор-границы, линия цитаты, край галереи) на одной вертикали.
 *
 * Один компонент — один источник правды для max-width + side decor.
 *
 * ## Декор боковин: `decor` × `side`
 *
 *  - `lines` (дефолт) — тонкие полупрозрачные вертикали. Generic для любого
 *    сайта (CSS-класс `.hg-line-*` в `globals.css`).
 *  - `vines` — декоративные лозы из изображений. **Niche-специфика** (текстуры
 *    задаются переменными `--decor-vine-*` в `tokens.css`; в template они пустые
 *    и `vines` выключены). Использовать на сайтах где бренд-система предусматривает
 *    декоративные виньетки (заводчик, ремесленная мастерская, бутик-кафе).
 *
 *  - `side` — с какой стороны рисовать декор: `left | right | both | none`.
 *    `none` = только полоса без декора.
 *
 * ## Принцип «лоза — только без своих линий» (R-vine)
 *
 * **Главное правило выбора `decor`:** если у внутреннего контента **уже есть
 * собственный боковой акцент** — `border-l` цитаты, край слайдера / галереи,
 * жирная вертикальная линия таблицы — `decor` ставим **`'none'`** (или не
 * оборачиваем в `ContentFrame` вообще). Лозы / линии — только когда контент
 * «голый» по бокам.
 *
 * ### Почему — детально
 *
 * 1. **Двойная подсветка = визуальный шум.** Лоза + border-l цитаты создают
 *    «двойную рамку» — взгляд цепляется, читать сложнее, бренд-впечатление
 *    портится. Один акцент на одной вертикали = единый ритм.
 *
 * 2. **Лоза — декоративная виньетка, не контейнер.** Она оформляет «пустые»
 *    края секции. Когда у блока есть свой край (галерея занимает всю
 *    ширину, цитата с border-l) — лоза становится фоном, не виньеткой,
 *    выглядит лишней.
 *
 * 3. **Mobile-проблема.** На узких экранах лоза часто скрывается / уезжает
 *    за viewport. Если у внутреннего блока есть свой боковой акцент —
 *    лучше его показать чем сжатую лозу.
 *
 * ### Чек-лист перед `decor="vines"`
 *
 *  - [ ] У блока внутри **нет** `border-l-*` / `border-r-*`?
 *  - [ ] У блока внутри **нет** края слайдера / галереи на 100% ширины?
 *  - [ ] У блока внутри **нет** линии цитаты / accent-bar / divider'а
 *        по вертикали?
 *
 * Если все три «нет» — `vines` уместны. Любое «да» → `decor='none'`.
 *
 * ### Где применяется
 *
 *  - ✅ Prose-секции (только текст, без своих рамок) — `vines`
 *  - ✅ Timeline (содержимое центрировано, без боковин) — `vines`
 *  - ✅ Hero-плашки без border-l — `vines`
 *  - ❌ Quote с `border-l-accent` — `none`
 *  - ❌ Carousel / BannerSlider — `none`
 *  - ❌ AchievementBanner с цветным border — `none`
 *
 * **Чистый wrapper.** Server Component (R14). Никакой логики.
 *
 * @example
 * ```tsx
 * // OK — текст без своих линий, лоза уместна
 * <ContentFrame side="both" decor="vines">
 *   <Prose ... />
 * </ContentFrame>
 *
 * // OK — цитата со своим border-l, лозу выключили
 * <ContentFrame side="none">
 *   <Quote ... />
 * </ContentFrame>
 *
 * // Generic сайт (без niche-виньеток):
 * <ContentFrame side="both" decor="lines">
 *   <ArticleBody ... />
 * </ContentFrame>
 * ```
 *
 * @see docs/ui-patterns/content-framing.md — расширенное описание принципа
 *      «лоза — только без своих линий» с примерами «до/после».
 */
export interface ContentFrameProps {
  /** С какой стороны рисовать декор. `none` — без декора, только полоса. */
  readonly side: 'left' | 'right' | 'both' | 'none';
  /** Вариант декора границ. `lines` (generic) или `vines` (niche-виньетка из изображений). */
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
