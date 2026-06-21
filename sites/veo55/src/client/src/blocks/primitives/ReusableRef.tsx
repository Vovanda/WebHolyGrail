import type { BlockNode, SiteSettings } from '@veo55/contracts';

import { getReusableBlockById } from '@/lib/api-client';
import { renderBlockNode } from '@/layouts/site-layout/block-registry';

/**
 * ReusableRef — рендерит содержимое переиспользуемого блока (`reusable-blocks`)
 * по ссылке `ref`.
 *
 * @remarks
 * Server Component (R14). Тянет запись по id, прогоняет её `content`
 * через тот же block-registry. Если запись удалена / не найдена —
 * dev показывает сообщение, prod возвращает `null` (gracefully).
 *
 * **Циклов нет:** коллекция `ReusableBlocks` запрещает `reusable-ref`
 * внутри своего `content` (см. `REUSABLE_INNER_BLOCKS` в cms).
 */
export interface ReusableRefData {
  /** id записи в `reusable-blocks` или populated объект. */
  readonly ref?: string | number | { id?: string | number };
}

export async function ReusableRef({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: Partial<ReusableRefData> };
  readonly settings: SiteSettings;
}) {
  const ref = node.data?.ref;
  const refId: string | number | null =
    typeof ref === 'string' || typeof ref === 'number'
      ? ref
      : ref && typeof ref === 'object'
        ? (ref.id ?? null)
        : null;

  // Публика не должна видеть техсообщения. Тихо скрываемся, dev-warn в консоль.
  if (refId == null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ReusableRef] шаблон не выбран');
    }
    return null;
  }

  const doc = await getReusableBlockById(refId);
  if (!doc) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ReusableRef] шаблон id=${refId} не найден`);
    }
    return null;
  }

  return (
    <>
      {doc.content.map((child) => {
        // Payload отдаёт вложенные блоки flat-объектами. Block-registry ждёт
        // `node.data.<поля>` — оборачиваем (как в `app/(site)/[[...slug]]/page.tsx`).
        const wrapped: BlockNode = {
          blockType: child.blockType,
          id: child.id,
          data: child as unknown as Record<string, unknown>,
        };
        return <div key={child.id}>{renderBlockNode(wrapped, settings)}</div>;
      })}
    </>
  );
}
