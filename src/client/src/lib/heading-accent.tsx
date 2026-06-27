import type { ReactNode } from 'react';

/**
 * renderAccentHeading — рендерит heading с подсветкой `accent`-фрагмента
 * accent-цветом. Поиск substring case-sensitive (точное совпадение).
 *
 * Если accent пуст или не найден в heading — heading рендерится без подсветки
 * (graceful fallback).
 *
 * Возвращает ReactNode (фрагмент с inline span), оборачивается caller-блоком
 * в <h1>/<h2>/<span> с нужными font/size классами.
 */
export function renderAccentHeading(heading: string, accent?: string | null): ReactNode {
  if (!accent) return heading;
  const idx = heading.indexOf(accent);
  if (idx === -1) return heading;
  return (
    <>
      {heading.slice(0, idx)}
      <span className="text-accent">{accent}</span>
      {heading.slice(idx + accent.length)}
    </>
  );
}
