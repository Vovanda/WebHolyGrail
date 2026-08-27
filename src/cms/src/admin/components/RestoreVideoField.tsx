'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

/**
 * Возврат видео, помеченного к удалению.
 *
 * @remarks
 * Отсрочка перед стиранием нужна ровно для того, чтобы ошибку можно было
 * исправить. Без кнопки возврата исправить её мог бы только разработчик
 * запросом в базу — то есть отсрочка не работала бы.
 *
 * Показывается только у помеченных: у остальных места не занимает.
 */
export function RestoreVideoField() {
  const { id } = useDocumentInfo();
  const [deletedAt, setDeletedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    void fetch(`/api/media/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc) => setDeletedAt(doc?.hls?.deletedAt ?? null))
      .catch(() => undefined);
  }, [id]);

  if (!deletedAt) return null;

  const restore = async () => {
    setBusy(true);
    try {
      await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hls: { deletedAt: null } }),
      });
      // Перезагружаем страницу целиком: состояние карточки в админке зависит
      // от пометки в нескольких местах, и обновлять их по одному — способ
      // разойтись с базой.
      window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
        background: 'rgba(179, 38, 30, .1)',
        border: '1px solid rgba(179, 38, 30, .35)',
      }}
    >
      <span style={{ fontSize: 13 }}>
        Видео скрыт с сайта {new Date(deletedAt).toLocaleDateString('ru-RU')}. Файлы ещё на месте.
      </span>
      <button
        type="button"
        onClick={() => void restore()}
        disabled={busy}
        style={{ marginLeft: 'auto' }}
      >
        {busy ? 'Возвращаю…' : 'Вернуть на сайт'}
      </button>
    </div>
  );
}
