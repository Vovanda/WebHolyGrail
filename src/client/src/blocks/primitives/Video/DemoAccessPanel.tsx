'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

import { AccessCodeForm } from './AccessCodeForm';

/**
 * Демонстрация доступа по коду: получить код и тут же его ввести.
 *
 * @remarks
 * Витрина обязана давать потрогать. Без этого про закрытые ролики приходится
 * верить на слово: посетитель видит замок и уходит, так и не поняв, что
 * происходит после ввода кода.
 *
 * Кнопка появляется, только если генератор включён на стороне сервера. В
 * обычном инстансе шаблона он выключен, и панель молча не показывается —
 * иначе посторонний печатал бы себе ключи от платного.
 */
export interface DemoAccessPanelProps {
  /** Токен зрителя: в него дописывается набор при погашении. */
  readonly token: string;
  /** Подписи задаёт владелец в блоке; здесь только разумные значения по умолчанию. */
  readonly heading?: string | undefined;
  readonly text?: string | undefined;
  readonly className?: string | undefined;
}

export function DemoAccessPanel({ token, heading, text, className }: DemoAccessPanelProps) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const request = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch('/internal/video/demo-code', { method: 'POST' });
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
        <h3 className="text-body font-medium text-ink">{heading ?? 'Попробуйте сами'}</h3>
        <p className="text-sm text-muted">
          {text ??
            'Закрытые ролики открываются доступом, а доступ выдаётся кодом. Возьмите код и введите его, и увидите ровно то, что видит зритель, которому его прислали.'}
        </p>
      </div>

      {code ? (
        <p className="text-body text-ink">
          Ваш код: <strong className="tracking-widest">{code}</strong>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void request()}
          disabled={busy}
          className="self-start rounded-lg border border-border-strong px-4 py-2 text-body font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
        >
          {busy ? 'Готовим код…' : 'Получить код'}
        </button>
      )}

      {failed && (
        <p className="text-sm text-muted">
          Код сейчас не выдаётся. На обычном сайте эту кнопку не показывают вовсе — ключи от
          платного выдаёт владелец, а не страница.
        </p>
      )}

      <AccessCodeForm token={token} />
    </section>
  );
}
