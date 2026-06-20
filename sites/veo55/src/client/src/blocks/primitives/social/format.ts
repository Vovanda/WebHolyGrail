/**
 * Форматтеры дат и чисел для соц-постов. Логика 1:1 с legacy
 * `news.html → fmtDate / fmtNum`:
 *  - `< 60s`   → «только что»
 *  - `< 1h`    → «N мин назад»
 *  - `< 24h`   → «N ч назад»
 *  - `< 7d`    → «N дн назад»
 *  - старше    → «12 окт. в 14:30», добавляем год если другой
 *  - числа     → 1.2k для >=1000
 */

const MONTHS = [
  'янв.',
  'фев.',
  'мар.',
  'апр.',
  'мая',
  'июн.',
  'июл.',
  'авг.',
  'сент.',
  'окт.',
  'нояб.',
  'дек.',
];

export function formatRelativeDate(unixSec: number): string {
  if (!unixSec) return '';
  const now = Math.floor(Date.now() / 1000);
  const diff = now - unixSec;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} дн назад`;
  const d = new Date(unixSec * 1000);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()] ?? '';
  const year = d.getFullYear();
  const yearNow = new Date().getFullYear();
  const yearPart = year !== yearNow ? ` ${year}` : '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month}${yearPart} в ${hh}:${mm}`;
}

export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}
