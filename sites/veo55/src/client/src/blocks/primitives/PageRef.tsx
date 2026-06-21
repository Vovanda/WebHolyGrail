import type { BlockNode, PageDoc, SiteSettings } from '@veo55/contracts';

import { getPageById } from '@/lib/api-client';
import { renderBlockNode } from '@/layouts/site-layout/block-registry';

/**
 * PageRef — встраивает содержимое другой страницы (`Pages.blocks`) внутрь
 * текущей.
 *
 * @remarks
 * Server Component (R14). Тянет запись Pages по id, прогоняет blocks через
 * тот же block-registry.
 *
 * **Защита от циклов** через depth-guard в `node.data._depth` (инкрементируется
 * при каждом вложении). Максимум 3 уровня — после этого блок не рендерится
 * и в dev выводит warning. Уровень счётчика передаётся как поле в data
 * (всё ещё JSON-сериализуемо, R5+).
 */
export interface PageRefData {
  /** id записи в `pages` или populated объект. */
  readonly ref?: string | number | PageDoc | { id?: string | number };
  /** Депт-гард, ставится автоматически рендерером при вложении. */
  readonly _depth?: number;
}

const MAX_DEPTH = 3;

export async function PageRef({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: Partial<PageRefData> };
  readonly settings: SiteSettings;
}) {
  const depth = node.data?._depth ?? 0;
  // Публика не должна видеть техсообщения. Цикл / отсутствующая страница =
  // тихо ничего не рендерим. Для отладки — console.warn в dev.
  if (depth >= MAX_DEPTH) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PageRef] достигнут лимит вложенности ${MAX_DEPTH} — возможен цикл`);
    }
    return null;
  }

  const ref = node.data?.ref;
  const refId: string | number | null =
    typeof ref === 'string' || typeof ref === 'number'
      ? ref
      : ref && typeof ref === 'object'
        ? ((ref as { id?: string | number }).id ?? null)
        : null;

  if (refId == null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PageRef] страница не выбрана');
    }
    return null;
  }

  const page = await getPageById(refId);
  if (!page) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[PageRef] страница id=${refId} не найдена`);
    }
    return null;
  }

  return (
    <>
      {page.blocks.map((child) => {
        // Payload отдаёт блоки страницы как flat-объекты (`{id, blockType, ...поля}`).
        // Block-registry ждёт `node.data.<поля>` — оборачиваем, как делает
        // основной маршрут `app/(site)/[[...slug]]/page.tsx`.
        const wrappedData =
          child.blockType === 'page-ref'
            ? { ...(child as unknown as Record<string, unknown>), _depth: depth + 1 }
            : (child as unknown as Record<string, unknown>);
        const wrapped: BlockNode = {
          blockType: child.blockType,
          id: child.id,
          data: wrappedData,
        };
        return <div key={child.id}>{renderBlockNode(wrapped, settings)}</div>;
      })}
    </>
  );
}
