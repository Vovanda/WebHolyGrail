'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Ввод кода доступа.
 *
 * @remarks
 * Клиентский по необходимости (R14): человек печатает код, и ответ должен
 * появиться на месте, без перезагрузки.
 *
 * Погашенный код дописывает набор прямо в токен зрителя, поэтому страница
 * перезагружается сразу после успеха: закрытые ролики надо пересобрать на
 * сервере с новым токеном, а не подкрашивать замки в браузере.
 */
export interface AccessCodeFormProps {
  /** Токен зрителя: в него дописывается набор. */
  readonly token: string;
  readonly className?: string;
}

/** Что показать вместо кода ошибки. */
const REASON: Record<string, string> = {
  'not-found': 'Такого кода нет. Проверьте, не потерялся ли символ.',
  expired: 'Срок кода истёк.',
  'used-up': 'Код уже использован столько раз, сколько было можно.',
  'sign-in-required': 'Этот код работает только после входа.',
  'bad-token': 'Страница открыта слишком давно — обновите её и попробуйте снова.',
};

export function AccessCodeForm({ token, className }: AccessCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || busy) return;

    setBusy(true);
    setError(null);
    try {
      // Запрос идёт через свой же домен (R15): прямое обращение к CMS с https-страницы
      // упирается в проверку доступа к локальной сети и пугает системным окном.
      const response = await fetch('/internal/video/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, token }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(REASON[body.error ?? ''] ?? 'Код не сработал.');
        return;
      }

      // Токен обновился, и закрытое теперь открыто: страницу пересобирает
      // сервер — так же, как он собирал её с замками.
      window.location.reload();
    } catch {
      setError('Не получилось проверить код. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        <label className="flex-1">
          <span className="sr-only">Код доступа</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Код доступа"
            autoComplete="one-time-code"
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-body uppercase tracking-widest text-ink outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-border-strong"
          />
        </label>
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Проверяем…' : 'Открыть'}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
