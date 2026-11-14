/** Число позиций словами: 1 позиция, 3 позиции, 5 позиций, 11 позиций. */
export function positions(n: number): string {
  const d = n % 10;
  const dd = n % 100;
  const word =
    d === 1 && dd !== 11
      ? 'позиция'
      : d >= 2 && d <= 4 && (dd < 12 || dd > 14)
        ? 'позиции'
        : 'позиций';
  return `${n} ${word}`;
}
