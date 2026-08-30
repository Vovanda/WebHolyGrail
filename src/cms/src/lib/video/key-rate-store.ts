import type { Payload } from 'payload';

import { decideKeyRate, emptyRateState, type RateDecision, type RateState } from './key-rate';

/**
 * Счёт ключей в базе - один на все процессы.
 *
 * @remarks
 * При выкладке рядом работают два цвета на одной базе, и память у каждого своя.
 * Со счётом в памяти смена цвета возвращала бы выкачивающему полный запас,
 * а выкачивание как раз растянуто во времени - ровно на такие промежутки.
 *
 * Решение остаётся чистым и лежит в соседнем файле; здесь только хранение.
 */
export async function checkKeyRateShared(
  payload: Payload,
  viewer: string,
  key: string,
  now: number = Date.now(),
): Promise<RateDecision> {
  const state = await load(payload, viewer, now);
  const { decision, next } = decideKeyRate(state.value, key, now);
  await save(payload, viewer, state.id, next);
  return decision;
}

interface Loaded {
  readonly id: string | number | null;
  readonly value: RateState;
}

async function load(payload: Payload, viewer: string, now: number): Promise<Loaded> {
  const found = await payload.find({
    collection: 'key-usage',
    where: { viewer: { equals: viewer } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });

  const doc = found.docs[0] as
    | { id: string | number; left?: number; at?: number; seen?: unknown }
    | undefined;
  if (!doc) return { id: null, value: emptyRateState(now) };

  return {
    id: doc.id,
    value: {
      left: typeof doc.left === 'number' ? doc.left : emptyRateState(now).left,
      at: typeof doc.at === 'number' ? doc.at : now,
      seen: asSeen(doc.seen),
    },
  };
}

async function save(
  payload: Payload,
  viewer: string,
  id: string | number | null,
  state: RateState,
): Promise<void> {
  const data = { viewer, left: state.left, at: state.at, seen: state.seen };

  /*
    Строку мог завести соседний цвет между чтением и записью. Тогда создание
    упирается в единственность идентичности - это не поломка выдачи: счёт разойдётся
    на один ключ, а следующий запрос увидит уже общую строку.
  */
  try {
    if (id === null) {
      await payload.create({ collection: 'key-usage', data, overrideAccess: true });
      return;
    }
    await payload.update({ collection: 'key-usage', id, data, overrideAccess: true });
  } catch {
    // Пропавшая строка и гонка при создании ключи выдавать не мешают: счёт
    // разойдётся на один ключ, а следующий запрос увидит уже общую строку.
  }
}

function asSeen(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  const out: Record<string, number> = {};
  for (const [key, when] of Object.entries(value as Record<string, unknown>)) {
    if (typeof when === 'number') out[key] = when;
  }
  return out;
}
