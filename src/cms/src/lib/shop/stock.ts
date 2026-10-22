/**
 * Списание и возврат остатка - условной записью в базе.
 *
 * @remarks
 * Проверка «хватит ли» и списание - одна запись: `UPDATE ... WHERE stock >= n`.
 * Два покупателя одного щенка - даже из двух процессов CMS на переключении
 * blue-green - не спишут его дважды: вторая запись не найдёт строку. Транзакций
 * в движке нет (#155), поэтому заказ из нескольких строк при неудаче на любой
 * из них возвращает уже списанное сам.
 *
 * Пустой остаток - без ограничений: запись проходит и ничего не меняет.
 */
export type Execute = (sql: string, args: readonly number[]) => Promise<number>;

export const TAKE_SQL =
  'UPDATE offers SET stock = CASE WHEN stock IS NULL THEN NULL ELSE stock - ? END WHERE id = ? AND (stock IS NULL OR stock >= ?)';
export const RETURN_SQL = 'UPDATE offers SET stock = stock + ? WHERE id = ? AND stock IS NOT NULL';

export type Take = { ok: true } | { ok: false; offer: number };

/** Списывает строки по одной; не хватило на какой-то - возвращает списанное и называет её. */
export async function takeStock(
  execute: Execute,
  lines: readonly { offer: number; quantity: number }[],
): Promise<Take> {
  const taken: { offer: number; quantity: number }[] = [];
  for (const line of lines) {
    const changed = await execute(TAKE_SQL, [line.quantity, line.offer, line.quantity]);
    if (changed !== 1) {
      await returnStock(execute, taken);
      return { ok: false, offer: line.offer };
    }
    taken.push(line);
  }
  return { ok: true };
}

export async function returnStock(
  execute: Execute,
  lines: readonly { offer: number; quantity: number }[],
): Promise<void> {
  for (const line of lines) await execute(RETURN_SQL, [line.quantity, line.offer]);
}
