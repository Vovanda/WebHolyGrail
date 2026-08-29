import type { BlockNode, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { LexicalRenderer } from './LexicalRenderer';

/**
 * Collapsible — свёрнутый кусок текста внутри статьи.
 *
 * @remarks
 * Выкладка, которую можно пропустить: вывод формулы, разбор замера, длинный
 * пример. Автор говорит, что подробность есть, а читатель решает, разворачивать ли.
 *
 * Собран на `details` и `summary`, а не на своём переключателе с состоянием:
 * так он раскрывается без единой строки скрипта (R14), ищется поиском браузера
 * по свёрнутому тексту и читается программами чтения с экрана как то, чем
 * является. Свой аккордеон всё это пришлось бы возвращать руками.
 */
export interface CollapsibleProps {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
  readonly className?: string;
}

interface CollapsibleData {
  readonly summary?: string;
  readonly body?: unknown;
  readonly openByDefault?: boolean;
}

export function Collapsible({ node, settings, className }: CollapsibleProps) {
  const data = (node.data ?? {}) as CollapsibleData;
  if (!data.summary || !data.body) return null;

  return (
    <details
      data-part="collapsible"
      open={data.openByDefault === true}
      className={cn(
        'border-border bg-surface my-6 rounded-lg border',
        /*
          Обёртка блоков в статье намеренно выводит их за колонку текста - видео
          и плейлист так и должны стоять. Свёрнутый текст остаётся текстом,
          поэтому отрицательные поля обёртки здесь возвращаются обратно: иначе
          рамка съезжает влево и не совпадает с абзацами вокруг.
        */
        'mx-4 md:mx-8 lg:mx-16',
        // Уголок раскрытия рисуем сами - у встроенного нет ни цвета из палитры,
        // ни одинакового вида в разных браузерах.
        '[&>summary]:list-none [&>summary::-webkit-details-marker]:hidden',
        className,
      )}
    >
      <summary
        data-part="collapsible-summary"
        className="text-ink hover:text-accent flex cursor-pointer items-center gap-2 px-4 py-3 font-medium transition-colors select-none md:px-5"
      >
        <span
          data-part="collapsible-marker"
          aria-hidden="true"
          className="text-muted transition-transform duration-200 [details[open]>summary>&]:rotate-90"
        >
          ▸
        </span>
        {data.summary}
      </summary>

      <div data-part="collapsible-body" className="border-border border-t px-4 py-4 md:px-5">
        <LexicalRenderer value={data.body} settings={settings} />
      </div>
    </details>
  );
}
