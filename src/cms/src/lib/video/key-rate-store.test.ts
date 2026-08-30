import { describe, expect, it, vi } from 'vitest';

/**
 * Счёт ключей в базе.
 *
 * @remarks
 * Решение о выдаче принимает чистая `decideKeyRate`; здесь проверяется хранение:
 * что прочитано, что записано и что выдача переживает сбой записи.
 */

import { checkKeyRateShared } from './key-rate-store.js';

const NOW = 1_700_000_000_000;

const store = (doc: Record<string, unknown> | null, failing = false) => {
  const created: Array<Record<string, unknown>> = [];
  const updated: Array<Record<string, unknown>> = [];
  const payload = {
    find: vi.fn(async () => ({ docs: doc ? [doc] : [] })),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      if (failing) throw new Error('строку успел завести соседний цвет');
      created.push(data);
      return { id: 1 };
    }),
    update: vi.fn(async (args: Record<string, unknown>) => {
      if (failing) throw new Error('строка пропала');
      updated.push(args);
      return args;
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
  return { payload, created, updated };
};

describe('счёт ключей в базе', () => {
  it('первый ключ заводит строку на зрителя', async () => {
    const { payload, created } = store(null);
    const decision = await checkKeyRateShared(payload, 'маркер-1', 'ключ-1', NOW);

    expect(decision.allowed).toBe(true);
    expect(created[0]).toMatchObject({ viewer: 'маркер-1' });
    // Отметки хранятся как «ключ: когда взят».
    expect(created[0]?.['seen']).toHaveProperty('ключ-1');
  });

  it('прежний счёт читается из строки, а не начинается заново', async () => {
    const { payload, updated } = store({ id: 5, left: 3, at: NOW, seen: { 'ключ-1': NOW } });
    await checkKeyRateShared(payload, 'маркер-1', 'ключ-2', NOW);

    expect(updated[0]).toMatchObject({ id: 5 });
    expect(updated[0]?.['data']).toMatchObject({ viewer: 'маркер-1' });
  });

  it('повторный ключ к тому же отрезку счёт не тратит', async () => {
    const { payload, updated } = store({ id: 5, left: 3, at: NOW, seen: { 'ключ-1': NOW } });
    await checkKeyRateShared(payload, 'маркер-1', 'ключ-1', NOW);

    const data = updated[0]?.['data'] as { left?: number };
    expect(data?.left).toBe(3);
  });

  it('испорченная строка читается как пустая', async () => {
    // Значения не того вида читаются как пустые, а не отнимают весь запас.
    const { payload } = store({ id: 5, left: 'много', at: 'вчера', seen: 'ключ' });
    const decision = await checkKeyRateShared(payload, 'маркер-1', 'ключ-1', NOW);
    expect(decision.allowed).toBe(true);
  });

  it('сбой записи ключ выдать не мешает', async () => {
    // Строку мог завести соседний цвет между чтением и записью: счёт разойдётся
    // на один ключ, а следующий запрос увидит общую строку.
    const { payload } = store(null, true);
    const decision = await checkKeyRateShared(payload, 'маркер-1', 'ключ-1', NOW);
    expect(decision.allowed).toBe(true);
  });
});
