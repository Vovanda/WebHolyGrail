'use client';

import { useRouter } from 'next/navigation';
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
 *
 * Замки - это соседи по списку. Сама страница закрытой записи собрана
 * сервером и вместо кадра показывает эту форму: снятие замков её не меняет,
 * поэтому следом просим страницу перечитать себя. Иначе право уже выдано,
 * а человек видит ту же форму и решает, что код не подошёл.
 */
export interface AccessCodeFormProps {
  /** Токен зрителя: в него дописывается плейлист. */
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
 */
const REASON: Record<string, string> = {
  invalid: 'К сожалению, код уже использован разрешённое число раз или больше не действует.',
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

export function AccessCodeForm({ className }: AccessCodeFormProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

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
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(REASON[body.error ?? ''] ?? REASON['invalid']!);
        return;
      }

      const data = (await response.json()) as {
        accessId?: string | number;
        granted?: ReadonlyArray<{ kind: 'playlists' | 'media'; id: string | number }>;
      };

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
          /*
            Событие несёт состав доступа: списки снимают замки только с того,
            что в него входит. Доступ покрывает и подборки, и отдельные записи
            разом, поэтому это список, а не одна вещь.
          */
          new CustomEvent(ACCESS_GRANTED_EVENT, {
            detail: { accessId: data.accessId, granted: data.granted ?? null },
          }),
        );
        // Страница собрана сервером: пока он не пересобрал её с новым правом,
        // на месте кадра остаётся эта же форма. Состояние ввода при этом
        // сохраняется - страница не перезагружается, а перечитывается.
        router.refresh();
      }, CLOSE_ANIMATION_MS);
    } catch {
      setError('Не получилось проверить код. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  /**
   * Вставить код из буфера.
   *
   * @remarks
   * Буфер доступен не везде: без защищённого соединения и без разрешения
   * браузер откажет. Отказ проглатываем - кнопка просто не сработает, а поле
   * остаётся обычным, и код можно вставить как раньше.
   */
  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setCode(text.trim());
    } catch {
      // Молча: заводить сообщение об ошибке ради необязательного удобства незачем.
    }
  };

  return (
    <form onSubmit={submit} className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Код доступа</span>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Код доступа"
            autoComplete="one-time-code"
            spellCheck={false}
            className="w-full rounded-lg border border-border bg-paper py-2 pl-3 pr-11 text-body uppercase tracking-widest text-ink outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-border-strong"
          />

          {/*
            Код приходит в переписке, и его копируют. На телефоне вставка через
            долгое нажатие с попаданием в нужное меню - лишняя возня там, где
            и так теряют.
          */}
          <button
            type="button"
            onClick={paste}
            aria-label="Вставить код из буфера"
            title="Вставить"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <PasteIcon />
          </button>
        </label>
        <button
          type="submit"
          disabled={busy || !code.trim()}
          data-part="action"
          className="rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-fg transition-colors hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? 'Проверяем…' : 'Открыть'}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}

/** Значок вставки: два листа, как принято обозначать буфер обмена. */
function PasteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 3h6a1 1 0 0 1 1 1v1H8V4a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
