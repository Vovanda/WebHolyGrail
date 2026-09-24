/**
 * Отправка последнего значения из потока частых изменений.
 *
 * @remarks
 * Форма присылает содержимое на каждый набранный знак, а отправлять каждое -
 * значит на медленной сети копить очередь запросов, которые устарели ещё
 * в пути. Здесь в полёте не больше одного запроса и не чаще раза в интервал;
 * всё, что пришло между ними, схлопывается в последнее значение.
 *
 * Неудача не останавливает поток: следующее изменение уйдёт как обычно,
 * а показ остаётся на последнем удачном.
 */
export interface LatestSender<T> {
  push(value: T): void;
  /** Остановить: отложенное не уйдёт. */
  stop(): void;
}

export function createLatestSender<T>({
  send,
  interval,
  now = Date.now,
  schedule = (run, ms) => {
    const timer = setTimeout(run, ms);
    return () => clearTimeout(timer);
  },
}: {
  readonly send: (value: T) => Promise<unknown>;
  readonly interval: number;
  readonly now?: () => number;
  /** Отложить запуск; возвращает отмену. */
  readonly schedule?: (run: () => void, ms: number) => () => void;
}): LatestSender<T> {
  let pending: { value: T } | null = null;
  let flying = false;
  let lastStart = -Infinity;
  let cancel: (() => void) | null = null;
  let stopped = false;

  const flush = () => {
    cancel = null;
    if (stopped || flying || !pending) return;
    const wait = lastStart + interval - now();
    if (wait > 0) {
      cancel = schedule(flush, wait);
      return;
    }
    const { value } = pending;
    pending = null;
    flying = true;
    lastStart = now();
    send(value)
      .catch(() => undefined)
      .finally(() => {
        flying = false;
        if (pending && !cancel) flush();
      });
  };

  return {
    push(value) {
      if (stopped) return;
      pending = { value };
      if (!cancel) flush();
    },
    stop() {
      stopped = true;
      cancel?.();
      cancel = null;
      pending = null;
    },
  };
}
