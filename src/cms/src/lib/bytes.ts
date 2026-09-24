/**
 * Вес файла человеческими словами: `640 Б`, `8.4 КБ`, `120 МБ`.
 *
 * @remarks
 * До десяти единиц - с десятой, дальше целым: разница между 120,4 и 120 МБ
 * ничего не говорит, а между 1,4 и 1 МБ - вдвое.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  const units = ['КБ', 'МБ', 'ГБ'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
