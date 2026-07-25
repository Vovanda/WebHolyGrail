import type { BlockNode, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { LexicalRenderer } from './LexicalRenderer';

/**
 * RichTextBlock — блок `rich-text` на странице: форматированный текст,
 * списки, ссылки и картинки по ходу.
 *
 * @remarks
 * Дефолтная ширина — колонка статьи: длинный текст читается плохо во всю
 * ширину экрана.
 */
export interface RichTextBlockProps {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
  readonly className?: string;
}

interface RichTextData {
  readonly content?: unknown;
  readonly width?: 'content' | 'wide';
}

export function RichTextBlock({ node, className }: RichTextBlockProps) {
  const data = (node.data ?? {}) as RichTextData;
  if (!data.content) return null;

  return (
    <section
      className={cn(
        'mx-auto px-4 md:px-6 py-8 md:py-12',
        data.width === 'wide' ? 'max-w-wide' : 'max-w-content',
        className,
      )}
    >
      <LexicalRenderer value={data.content} className="text-lg" />
    </section>
  );
}
