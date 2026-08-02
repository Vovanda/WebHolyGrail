'use client';

import { useEffect, useState } from 'react';

/**
 * CopyLinkButton — копирует адрес текущей страницы.
 *
 * @remarks
 * Client-компонент по необходимости (R14): буфер обмена доступен только из
 * браузера.
 *
 * Нужен там, куда нельзя дойти по меню: страницу специалиста находят через
 * каталог, и единственный способ поделиться ею — вытащить адрес из строки
 * браузера. На телефоне это несколько неочевидных касаний, поэтому кнопка
 * стоит рядом с крошками — там, где человек и так ищет, где он находится.
 *
 * Адрес берём из `location` в момент клика, а не из пропсов: так в буфер
 * попадает то же, что видно в адресной строке, включая выбранные фильтры.
 */
export function CopyLinkButton({ label = 'Скопировать ссылку' }: { readonly label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Без https и в старых браузерах clipboard недоступен. Показываем адрес
      // выделенным — человек копирует сам, вместо кнопки, которая молча ничего
      // не делает.
      window.prompt('Скопируйте ссылку:', url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={label}
      aria-label={label}
      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-accent-soft hover:text-ink"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{copied ? 'Скопировано' : 'Ссылка'}</span>
    </button>
  );
}
