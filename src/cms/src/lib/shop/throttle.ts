/**
 * Лимиты частоты на открытых ручках магазина.
 *
 * @remarks
 * Без них бот заваливает менеджера заказами и выбирает остаток штучных позиций.
 * Счёт в памяти процесса, окнами: перезапуск обнуляет счёт, для лимитов в
 * минутах и часах это приемлемо. Перенесено из магазина мембран.
 */
export type Rule = { limit: number; windowMs: number };

export const RULES = {
  placeOrder: { limit: 10, windowMs: 60 * 60_000 },
  buyerAction: { limit: 60, windowMs: 10 * 60_000 },
  // Пустой поиск пишется в журнал: один клиент не накрутит счёт запросу.
  searchMiss: { limit: 20, windowMs: 10 * 60_000 },
} as const satisfies Record<string, Rule>;

export type RuleName = keyof typeof RULES;

const windows = new Map<string, { count: number; startedAt: number }>();

export type Decision = { allowed: true } | { allowed: false; retryAfterSeconds: number };

const MAX_WINDOWS = 10_000;

/** Убирает окна, срок которых вышел: иначе таблица растёт с каждым новым адресом. */
function sweep(now: number): void {
  for (const [id, w] of windows) {
    const rule = RULES[id.slice(0, id.indexOf(':')) as RuleName];
    if (!rule || now - w.startedAt >= rule.windowMs) windows.delete(id);
  }
}

/** Засчитывает обращение и говорит, можно ли его обслужить. */
export function take(rule: RuleName, key: string, now = Date.now()): Decision {
  const { limit, windowMs } = RULES[rule];
  if (windows.size >= MAX_WINDOWS) sweep(now);
  const id = `${rule}:${key}`;
  const current = windows.get(id);
  if (!current || now - current.startedAt >= windowMs) {
    windows.set(id, { count: 1, startedAt: now });
    return { allowed: true };
  }
  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((current.startedAt + windowMs - now) / 1000),
    };
  }
  current.count += 1;
  return { allowed: true };
}

/** Только для тестов. */
export function resetThrottle(): void {
  windows.clear();
}

/** Только для тестов: сколько окон сейчас в таблице. */
export function throttleSize(): number {
  return windows.size;
}
