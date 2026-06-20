'use client';

import { useState } from 'react';

/**
 * CopyLinkButton — копирует ссылку в буфер обмена. Использует
 * `navigator.clipboard` (HTTPS / localhost обязательно).
 *
 * Принимает относительный `path` (например `puppies/litera-n-2026`) и
 * собирает полный URL через `window.location.origin` уже в браузере —
 * чтобы при SSR не зависеть от хоста запроса. Иначе пришлось бы тащить
 * absolute URL из контекста — лишняя сложность.
 */
export function CopyLinkButton({
  path,
  label,
}: {
  readonly path: string;
  readonly label?: string;
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  async function handleClick() {
    try {
      const url = `${window.location.origin}/${path.replace(/^\/+/, '')}`;
      await navigator.clipboard.writeText(url);
      setState('copied');
      setTimeout(() => setState('idle'), 1800);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2400);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label ?? 'Скопировать ссылку'}
      title={label ?? 'Скопировать ссылку'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-muted hover:text-accent hover:bg-surface transition-colors text-sm font-display italic"
    >
      {state === 'copied' ? (
        <>
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
            <path
              d="M4 10l4 4 8-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Скопировано
        </>
      ) : state === 'error' ? (
        'Не удалось'
      ) : (
        <>
          <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
            <path
              d="M8 12a3 3 0 0 1 0-4l3-3a3 3 0 1 1 4 4l-1 1M12 8a3 3 0 0 1 0 4l-3 3a3 3 0 1 1-4-4l1-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Скопировать ссылку
        </>
      )}
    </button>
  );
}
