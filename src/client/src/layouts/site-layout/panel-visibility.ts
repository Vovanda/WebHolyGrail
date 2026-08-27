import type { PanelVisibility } from 'contracts';

/**
 * Для какого экрана панель.
 *
 * @remarks
 * Ширину экрана серверная раскладка не знает, а угадывать её по устройству -
 * гадание: планшет в альбомной ориентации шире иного ноутбука. Поэтому панель
 * рисуется всегда, а прячется правилом стилей - тем же, что решает вопрос
 * при повороте телефона и при изменении окна.
 *
 * Граница взята общая для сайта: узкий экран заканчивается там же, где у
 * остальной вёрстки.
 */
export function panelScreenClass(visibility: PanelVisibility | undefined): string {
  if (visibility === 'mobile') return 'md:hidden';
  if (visibility === 'desktop') return 'hidden md:block';
  return '';
}
