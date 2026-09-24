import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createLatestSender } from './latest-sender';

describe('отправка последнего значения', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const deferred = () => {
    let resolve = () => {};
    let reject = (_: unknown) => {};
    const promise = new Promise<void>((ok, fail) => {
      resolve = ok;
      reject = fail;
    });
    return { promise, resolve, reject };
  };

  it('первое уходит сразу, пачка за секунду - одним последним', async () => {
    const sent: number[] = [];
    const sender = createLatestSender<number>({
      send: async (value) => void sent.push(value),
      interval: 1000,
      now: () => Date.now(),
    });
    sender.push(1);
    await vi.advanceTimersByTimeAsync(0);
    for (const value of [2, 3, 4]) {
      sender.push(value);
      await vi.advanceTimersByTimeAsync(100);
    }
    expect(sent).toEqual([1]);
    await vi.advanceTimersByTimeAsync(1000);
    expect(sent).toEqual([1, 4]);
  });

  it('пока идёт запрос, второй не стартует, а уходит следом последнее', async () => {
    const calls: { value: number; done: ReturnType<typeof deferred> }[] = [];
    const sender = createLatestSender<number>({
      send: (value) => {
        const done = deferred();
        calls.push({ value, done });
        return done.promise;
      },
      interval: 1000,
      now: () => Date.now(),
    });
    sender.push(1);
    await vi.advanceTimersByTimeAsync(1500);
    sender.push(2);
    sender.push(3);
    await vi.advanceTimersByTimeAsync(2000);
    expect(calls.map((call) => call.value)).toEqual([1]);
    calls[0]!.done.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls.map((call) => call.value)).toEqual([1, 3]);
  });

  it('неудача не останавливает поток', async () => {
    const calls: number[] = [];
    const sender = createLatestSender<number>({
      send: async (value) => {
        calls.push(value);
        if (value === 1) throw new Error('сеть');
      },
      interval: 1000,
      now: () => Date.now(),
    });
    sender.push(1);
    await vi.advanceTimersByTimeAsync(0);
    sender.push(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(calls).toEqual([1, 2]);
  });

  it('после остановки отложенное не уходит', async () => {
    const sent: number[] = [];
    const sender = createLatestSender<number>({
      send: async (value) => void sent.push(value),
      interval: 1000,
      now: () => Date.now(),
    });
    sender.push(1);
    await vi.advanceTimersByTimeAsync(0);
    sender.push(2);
    sender.stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(sent).toEqual([1]);
  });
});
