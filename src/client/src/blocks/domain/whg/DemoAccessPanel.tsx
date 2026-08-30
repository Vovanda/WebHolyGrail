'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Демонстрация доступа по коду: получить код и тут же его ввести.
 *
 * @remarks
 * Витрина обязана давать потрогать. Без этого про закрытые видео приходится
 * верить на слово: посетитель видит замок и уходит, так и не поняв, что
 * происходит после ввода кода.
 *
 * Кнопка появляется, только если генератор включён на стороне сервера. В
 * обычном инстансе шаблона он выключен, и панель молча не показывается —
 * иначе посторонний печатал бы себе ключи от платного.
 */
export interface DemoAccessPanelProps {
  /** Подписи задаёт владелец в блоке; здесь только разумные значения по умолчанию. */
  readonly heading?: string | undefined;
  readonly text?: string | undefined;
  readonly className?: string | undefined;
}

export function DemoAccessPanel({ heading, text, className }: DemoAccessPanelProps) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Буфер недоступен — код виден на экране, перепишут руками.
    }
  };

  const request = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch('/internal/domain/demo-code', { method: 'POST' });
      if (!response.ok) {
        setFailed(true);
        return;
      }
      const data = (await response.json()) as { code?: string };
      setCode(data.code ?? null);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-border bg-surface p-4',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 data-part="title" className="text-body font-medium text-ink">
          {heading ?? 'Попробуйте сами'}
        </h3>
        <p data-part="subtitle" className="text-sm text-muted">
          {text ??
            'Закрытые видео открываются кодом. Возьмите код и введите его, и увидите ровно то, что видит зритель, которому его прислали.'}
        </p>
      </div>

      {code ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-body text-ink">
            Ваш код: <strong className="tracking-widest">{code}</strong>
          </p>

          {/* Копирование, а не выделение пальцем: код вводят в поле, которое
              стоит на месте плеера у закрытой записи, или переносят
              на другое устройство. */}
          <button
            type="button"
            data-part="action"
            onClick={() => void copy()}
            aria-label={copied ? 'Код скопирован' : 'Скопировать код'}
            className="icon-button icon-button--outlined"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-part="action"
          onClick={() => void request()}
          disabled={busy}
          className="self-start rounded-lg border border-border-strong px-4 py-2 text-body font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          {busy ? 'Готовим код…' : 'Получить код'}
        </button>
      )}

      {failed && <p className="text-sm text-muted">Код сейчас не выдаётся, попробуйте позже.</p>}
    </section>
  );
}

function CopyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
