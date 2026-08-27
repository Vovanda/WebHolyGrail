'use client';

import { useListRelationships } from '@payloadcms/ui';
import { useEffect } from 'react';

/**
 * Адрес картинки из связанного файла по значению поля в строке списка.
 *
 * @remarks
 * Список Payload грузится без вложенности, поэтому связь приходит
 * идентификатором, а не документом: своими силами ячейка адрес кадра не
 * достанет. Таблица при этом умеет догружать такие документы - одним запросом
 * на всю страницу, - и ячейке остаётся попросить нужный документ и взять
 * из него адрес.
 *
 * Если значение пришло документом (так бывает вне списка), запрос не нужен -
 * адрес берётся сразу.
 */
type FileDoc = {
  sizes?: Record<string, { url?: string } | undefined>;
  thumbnailURL?: string;
  url?: string;
};

function pickURL(doc: FileDoc | null | undefined): string | undefined {
  if (!doc) {
    return undefined;
  }
  return doc.thumbnailURL ?? doc.sizes?.['thumbnail']?.url ?? doc.url;
}

export function useRelatedImageURL(relationTo: string, value: unknown): string | undefined {
  const relationships = useListRelationships();
  const getRelationships = relationships?.getRelationships;

  const id = typeof value === 'number' || typeof value === 'string' ? value : undefined;

  useEffect(() => {
    if (id !== undefined && getRelationships) {
      getRelationships([{ relationTo, value: id }]);
    }
  }, [getRelationships, id, relationTo]);

  if (typeof value === 'object' && value !== null) {
    return pickURL(value as FileDoc);
  }

  if (id === undefined) {
    return undefined;
  }

  const loaded = relationships?.documents?.[relationTo]?.[id];
  return loaded ? pickURL(loaded as FileDoc) : undefined;
}
