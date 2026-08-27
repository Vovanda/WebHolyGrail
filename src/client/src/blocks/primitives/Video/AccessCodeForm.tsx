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
 * Погашенный код дописывает плейлист прямо в токен зрителя. Дальше окно
 * закрывается, и уже по закрытому окну страница снимает замки анимацией,
 * без перезагрузки.
 */
export interface AccessCodeFormProps {
  /** Токен зрителя: в него дописывается плейлист. */
  readonly token: string;
  readonly className?: string;
}

/**
 * Сколько уезжает окно.
 *
 * @remarks
 * Совпадает с длительностью его закрытия: замки снимаются после того, как
 * затемнение ушло, иначе анимацию просто не видно.
 */
const CLOSE_ANIMATION_MS = 320;

/** Имя события: плейлист открыт кодом. */
export const ACCESS_GRANTED_EVENT = 'whg:access-granted';

/**
 * Что показать вместо кода ошибки.
 *
 * @remarks
 * У всех случаев «код не сработал» текст один. Разные ответы — «такого кода
 * нет», «истёк», «израсходован» — подсказывали бы перебору, какой код
 * существует, а какой нет.
 *
 * Отдельно только требование входа: оно про самого зрителя и о коде ничего
 * не сообщает.
 */
const REASON: Record<string, string> = {
  invalid: 'К сожалению, код уже использован разрешённое число раз или больше не действует.',
  'sign-in-required': 'Этот код выдан для другого способа доступа.',
  'bad-token': 'Страница открыта слишком давно — обновите её и попробуйте снова.',
};

/**
 * Сколько символов в коде.
 *
 * @remarks
 * Короткий код отсеиваем на месте, не отправляя: это обычная опечатка, и
 * гонять её до сервера незачем. Заодно такие попытки не расходуют лимит.
 */
const CODE_LENGTH = 6;

export function AccessCodeForm({ token, className }: AccessCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim() || busy) return;

    // Опечатку видно сразу: до сервера такая попытка не доходит.
    if (code.replace(/[^0-9A-Za-z]/g, '').length < CODE_LENGTH) {
      setError(`Кода не хватает: в нём ${CODE_LENGTH} символов.`);
      return;
    }

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
        setError(REASON[body.error ?? ''] ?? REASON['invalid']!);
        return;
      }

      const data = (await response.json()) as { playlistId?: string | number };

      // Порядок важен. Сначала закрывается окно и уходит затемнение, и только
      // потом снимаются замки: иначе анимация проигрывается под размытым фоном,
      // человек её не видит и решает, что ничего не произошло.
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      // Замена адреса своих событий не порождает, поэтому шлём оба, на которые
      // подписано окно. Условие тут не ставим: адрес мог быть сброшен раньше, и
      // тогда окно оставалось открытым, а замки снимались под затемнением.
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      window.dispatchEvent(new PopStateEvent('popstate'));

      // Ждём, пока окно уедет: столько же длится его закрытие.
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent(ACCESS_GRANTED_EVENT, { detail: { playlistId: data.playlistId } }),
        );
      }, CLOSE_ANIMATION_MS);
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
