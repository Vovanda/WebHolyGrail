import type { BlockNode } from './blocks';

/**
 * ReusableBlockDoc — атомарный «шаблонный» блок из коллекции `reusable-blocks`.
 *
 * @remarks
 * Встраивается на любую страницу через {@link ReusableRefBlockNode}.
 * Меняешь содержимое — обновляется на всех страницах где встроен.
 */
export interface ReusableBlockDoc {
  readonly id: string | number;
  /** Имя для админки. На сайт не выводится. */
  readonly label: string;
  /** Внутренние блоки. Не может содержать `reusable-ref` (без циклов). */
  readonly content: readonly BlockNode[];
}

/**
 * Узел `reusable-ref` — ссылка на запись `ReusableBlockDoc`. На клиенте
 * рендерится через тот же block-registry рекурсивно по `content` запись-цели.
 */
export interface ReusableRefBlockNode {
  readonly blockType: 'reusable-ref';
  readonly id: string;
  /** ID записи в `reusable-blocks` (может быть string или populated объект). */
  readonly refId: string | number;
}

/**
 * Узел `page-ref` — встраивает содержимое другой страницы (`Pages.blocks`)
 * внутрь текущей. Депт-гард в рендерере ловит циклы (page → page → …).
 */
export interface PageRefBlockNode {
  readonly blockType: 'page-ref';
  readonly id: string;
  /** ID записи в `pages`. */
  readonly refId: string | number;
}
