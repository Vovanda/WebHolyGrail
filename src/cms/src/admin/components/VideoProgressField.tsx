'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Ход нарезки в карточке видео.
 *
 * @remarks
 * Нарезка часового видео идёт минутами. Без вестей о ней карточка выглядит
 * зависшей: владелец не понимает, работа идёт или всё встало, и перезапускает
 * заливку впустую.
 *
 * Полоса обновляется сама, пока видео готовится, и исчезает, когда всё готово:
 * у готового видео ей нечего показывать.
 */
export function VideoProgressField() {
  const { id } = useDocumentInfo();
  const [state, setState] = useState<{ status: string; percent: number } | null>(null);
  /*
    По двум замерам видно скорость, а из неё - сколько осталось. Голый процент
    отвечает «сколько сделано», а человека занимает другое: ждать ему минуту
    или полчаса.
  */
  const marks = useRef<Array<{ at: number; percent: number }>>([]);

  useEffect(() => {
    if (!id) return;

    let alive = true;
    const read = async () => {
      const doc = await fetch(`/api/media/${id}?depth=0`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (!alive || !doc?.hls) return;
      const percent = Number(doc.hls.progress ?? 0);
      const seen = marks.current;
      if (!seen.length || percent > (seen.at(-1)?.percent ?? 0)) {
        seen.push({ at: Date.now(), percent });
        // Держим только последние замеры: старые считают среднюю скорость за
        // всю нарезку, а она к концу успевает измениться.
        if (seen.length > 6) seen.shift();
      }
      setState({ status: String(doc.hls.status ?? ''), percent });
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
  const left = waiting ? null : estimateLeft(marks.current, percent);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ marginBottom: '.35rem', fontSize: '.8rem', opacity: 0.75 }}>
        {waiting
          ? 'Ждёт очереди на нарезку'
          : `Нарезается: ${percent}%${left ? ` · осталось ${left}` : ''}`}
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

/**
 * Сколько ещё ждать.
 *
 * @remarks
 * Считаем по скорости последних замеров, а не всей нарезки: к концу она
 * меняется, и средняя за всё время обманывает.
 *
 * Пока замеров мало или видео почти готова, ничего не показываем: неверная
 * оценка хуже её отсутствия.
 */
function estimateLeft(
  marks: ReadonlyArray<{ at: number; percent: number }>,
  percent: number,
): string | null {
  if (marks.length < 2 || percent >= 98) return null;

  const first = marks[0]!;
  const last = marks.at(-1)!;
  const grew = last.percent - first.percent;
  const spent = last.at - first.at;
  if (grew <= 0 || spent <= 0) return null;

  const secondsLeft = Math.round(((100 - percent) / grew) * (spent / 1000));
  if (secondsLeft < 20) return 'меньше минуты';
  if (secondsLeft < 90) return 'около минуты';

  const minutes = Math.round(secondsLeft / 60);
  if (minutes < 60) return `примерно ${minutes} мин`;
  return `больше часа`;
}
