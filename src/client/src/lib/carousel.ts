import type { CarouselBlockData } from 'contracts';

/**
 * Сколько места занимает кадр карточки карусели.
 *
 * @remarks
 * Ширину карточки задаёт блок, и она же годится для выбора ступени - запись
 * вида `min(18rem, 80vw)` браузер читает как размер. Доли от чего-то стороннего
 * он прочитать не может, и на них остаётся ширина по умолчанию: лишний вес
 * лучше кадра, выбранного мимо.
 */
export function cardPlace(data: Pick<CarouselBlockData, 'mode' | 'cardWidth'>): string {
  if (data.mode === 'single') return '(max-width: 768px) 100vw, 1200px';
  const width = data.cardWidth ?? '';
  return width && !width.includes('%') ? width : 'min(18rem, 80vw)';
}
