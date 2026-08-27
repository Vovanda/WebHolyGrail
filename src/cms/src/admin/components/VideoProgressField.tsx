'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

/**
 * Ход нарезки в карточке записи.
 *
 * @remarks
 * Нарезка часовой записи идёт минутами. Без вестей о ней карточка выглядит
 * зависшей: владелец не понимает, работа идёт или всё встало, и перезапускает
 * заливку впустую.
 *
 * Полоса обновляется сама, пока запись готовится, и исчезает, когда всё готово:
 * у готовой записи ей нечего показывать.
 */
export function VideoProgressField() {
  const { id } = useDocumentInfo();
  const [state, setState] = useState<{ status: string; percent: number } | null>(null);

  useEffect(() => {
    if (!id) return;

    let alive = true;
    const read = async () => {
      const doc = await fetch(`/api/media/${id}?depth=0`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (!alive || !doc?.hls) return;
      setState({ status: String(doc.hls.status ?? ''), percent: Number(doc.hls.progress ?? 0) });
    };

    void read();
    // Спрашиваем раз в несколько секунд: чаще незачем, реже - полоса стоит
    // на месте, и владелец опять не понимает, идёт ли работа.
    const timer = setInterval(read, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id]);

  if (!state) return null;
  if (state.status !== 'processing' && state.status !== 'pending') return null;

  const percent = Math.max(0, Math.min(100, state.percent));
  const waiting = state.status === 'pending';

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '.35rem', fontSize: '.8rem', opacity: 0.75 }}>
        {waiting ? 'Ждёт очереди на нарезку' : `Нарезается: ${percent}%`}
      </div>

      <div
        role="progressbar"
        aria-valuenow={waiting ? undefined : percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 6,
          borderRadius: 999,
          background: 'var(--theme-elevation-100)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: waiting ? '100%' : `${percent}%`,
            background: 'var(--theme-success-500, #2e8b57)',
            opacity: waiting ? 0.35 : 1,
            transition: 'width .4s ease',
          }}
        />
      </div>
    </div>
  );
}
