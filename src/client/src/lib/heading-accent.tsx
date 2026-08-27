import type { ReactNode } from 'react';

/**
 * Заголовок с выделенной частью.
 *
 * @remarks
 * Владелец пишет заголовок целиком, а рядом указывает, что в нём выделить.
 * Регистр не важен: «видео» найдёт «Видео» и покрасит ровно то, что стоит
 * в заголовке.
 *
 * Несколько частей перечисляются вертикальной чертой - «видео|сайте». Запятая
 * для этого не годится: она встречается в самом тексте.
 *
 * Длинные части ищутся первыми, иначе «видео» съело бы начало «видеокурса».
 *
 * Прежняя запись с меткой `{accent}` понимается тоже: заголовки, написанные
 * с ней, остаются прежними.
 */
export function renderAccentHeading(heading: string, accent?: string | null): ReactNode {
  const marked = heading.includes('{accent}');
  if (marked) {
    const [head = '', tail = ''] = heading.split('{accent}');
    return (
      <>
        {head}
        {accent ? <span className="text-accent">{accent}</span> : null}
        {tail}
      </>
    );
  }

  const needles = (accent ?? '')
    .split('|')
    .map((one) => one.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!needles.length) return heading;

  const parts: { text: string; accent: boolean }[] = [];
  let rest = heading;

  while (rest) {
    const lower = rest.toLowerCase();
    let at = -1;
    let found = '';

    for (const needle of needles) {
      const index = lower.indexOf(needle.toLowerCase());
      if (index >= 0 && (at < 0 || index < at)) {
        at = index;
        found = needle;
      }
    }

    if (at < 0) {
      parts.push({ text: rest, accent: false });
      break;
    }

    if (at > 0) parts.push({ text: rest.slice(0, at), accent: false });
    parts.push({ text: rest.slice(at, at + found.length), accent: true });
    rest = rest.slice(at + found.length);
  }

  return (
    <>
      {parts.map((part, index) =>
        part.accent ? (
          <span key={index} className="text-accent">
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}
