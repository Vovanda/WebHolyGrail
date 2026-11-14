'use client';

import { useEffect, useState } from 'react';

/**
 * CopyCode - короткий код с копированием по нажатию: артикул, номер, промокод.
 *
 * @remarks
 * Client-компонент по необходимости (R14): буфер обмена доступен только из
 * браузера. Код виден целиком, нажатие кладёт в буфер его, без подписи:
 * покупатель вставляет артикул в поиск или в письмо продавцу.
 *
 * Части размечены `data-part`: `code` - вся кнопка, `code-label` - подпись,
 * `code-value` - сам код.
 */
export function CopyCode({
  value,
  label,
  copyLabel,
}: {
  readonly value: string;
  /** Подпись перед кодом: «Арт.», «№». */
  readonly label?: string;
  /** Подпись кнопки для скринридера; пусто - «Скопировать <подпись> <код>». */
  readonly copyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // Без https буфер недоступен: код показывается выделенным, человек копирует сам.
      window.prompt('Скопируйте:', value);
    }
  }

  return (
    <button
      type="button"
      data-part="code"
      onClick={copy}
      aria-label={copyLabel ?? `Скопировать ${label ? `${label} ` : ''}${value}`}
      className="group inline-flex max-w-full items-center gap-1 rounded text-xs text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
    >
      {label && <span data-part="code-label">{label}</span>}
      <span data-part="code-value" className="min-w-0 truncate tabular-nums">
        {value}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0 opacity-60 group-hover:opacity-100"
      >
        {copied ? (
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="2" />
            <path
              d="M5 15V6a2 2 0 0 1 2-2h9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      <span aria-live="polite" className="sr-only">
        {copied ? 'Скопировано' : ''}
      </span>
    </button>
  );
}
