'use client';

import { useEffect, useState } from 'react';
import type { BlockNode, SiteSettings } from 'contracts';

import { Quote, type QuoteData } from './Quote';

/**
 * QuoteCycle — обёртка над Quote, циклически меняет `variant` по таймеру.
 *
 * @remarks
 * Демо-фишка template'а: одна цитата → автоматически переключается между
 * несколькими дизайн-вариантами Quote (card-accent-left / minimal-modern /
 * full-width-dark / photo-card). Показывает что блок гибкий "из коробки".
 *
 * 'use client' — нужен timer + useState. Сам Quote рендерится как и был
 * (внутри cycle переподписывает variant и Quote ре-рендерит секцию).
 *
 * Дефолтный интервал — 5 сек, дефолтная последовательность —
 * ['card-accent-left', 'full-width-dark', 'minimal-modern'].
 */

type Variant = NonNullable<QuoteData['variant']>;

export interface QuoteCycleData extends Omit<QuoteData, 'variant'> {
  /** Список вариантов для циклического переключения. Default — 3 variant'а. */
  readonly variants?: readonly Variant[];
  /** Интервал переключения, ms. Default — 5000. */
  readonly intervalMs?: number;
}

const DEFAULT_VARIANTS: readonly Variant[] = [
  'card-accent-left',
  'full-width-dark',
  'minimal-modern',
];

export function QuoteCycle({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: QuoteCycleData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const variants = data.variants && data.variants.length > 0 ? data.variants : DEFAULT_VARIANTS;
  const interval = data.intervalMs ?? 5000;

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (variants.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % variants.length), interval);
    return () => clearInterval(t);
  }, [variants, interval]);

  // Building a sub-node with the current variant — Quote читает variant из data.
  const subNode: BlockNode & { data?: QuoteData } = {
    ...node,
    blockType: 'quote',
    data: { ...data, variant: variants[idx]! },
  };

  return <Quote node={subNode} settings={settings} />;
}
