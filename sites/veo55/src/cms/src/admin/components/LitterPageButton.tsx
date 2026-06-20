'use client';

import { useState } from 'react';
import { useDocumentInfo } from '@payloadcms/ui';

/**
 * LitterPageButton — UI-кнопка на странице редактирования Litter:
 *  - Если страница для этого помёта ещё не создана → «Создать страницу помёта»
 *    (вызывает endpoint, который создаёт Pages запись с дефолтной композицией
 *    `litter-header → litter-pair-card → litter-puppies`).
 *  - Если уже есть → «Открыть страницу помёта» (редирект на её редактор).
 *
 * Где живёт страница: `Pages` slug `litter/<litter-slug>`. Эту же страницу
 * редактор потом перетаскивает блоками в админке как обычно.
 */
export default function LitterPageButton() {
  const { id } = useDocumentInfo();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!id) {
    return (
      <div style={{ marginTop: 8, color: '#888', fontSize: 13, fontStyle: 'italic' }}>
        Сохраните помёт, чтобы создать публичную страницу.
      </div>
    );
  }

  async function handleClick() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/litters/${id}/create-page`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { pageId: string | number };
      window.location.href = `/admin/collections/pages/${data.pageId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 4 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        style={{
          background: '#d4a437',
          color: '#2b221a',
          border: 'none',
          borderRadius: 4,
          padding: '8px 14px',
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          fontSize: 14,
        }}
      >
        {loading ? 'Открываю…' : 'Создать / открыть страницу помёта'}
      </button>
      {error && <div style={{ marginTop: 6, color: '#b54848', fontSize: 13 }}>Ошибка: {error}</div>}
      <div style={{ marginTop: 6, color: '#7a6f5f', fontSize: 12, fontStyle: 'italic' }}>
        Создаёт страницу со slug <code>puppies/{'{slug}'}</code>, композиция: Заголовок · Визитка ·
        Щенки. Дальше — обычная страница.
      </div>
    </div>
  );
}
