import type { BlockNode, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { Disclosure } from './Disclosure';
import { LexicalRenderer } from './RichText';

/**
 * CollapsibleSection — складной кусок на странице или внутри статьи.
 *
 * @remarks
 * Показ берёт готовый кубик, содержимое рисует тем же обходчиком, что и
 * остальной текст: внутри складного куска работает всё то же оформление и та
 * же вставка записей, что в обычном абзаце.
 *
 * Ширина как у текста, а не во всю страницу: кусок читают, а не разглядывают.
 */
export interface CollapsibleSectionProps {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
  readonly className?: string;
}

export function CollapsibleSection({ node, settings, className }: CollapsibleSectionProps) {
  const data = (node.data ?? {}) as {
    title?: string;
    body?: unknown;
    openByDefault?: boolean;
  };

  const title = data.title?.trim();
  if (!title) return null;

  return (
    /*
      Поля меньше, чем у секции во всю страницу: свёрнутый кусок читается частью
      текста. Совсем вплотную к соседям его тоже не ставят - без воздуха рамка
      слипается с абзацем над ней.
    */
    <section className={cn('mx-auto w-full max-w-content px-4 md:px-6 py-3', className)}>
      <Disclosure title={title} open={data.openByDefault === true}>
        <LexicalRenderer value={data.body} settings={settings} />
      </Disclosure>
    </section>
  );
}
