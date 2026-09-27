/**
 * Вуаль - слой цвета фона темы поверх фото: смягчает кадр и держит текст
 * читаемым. Одна мера на все места, где фото лежит под содержимым.
 */

/**
 * Процент вуали из настроек - в долю непрозрачности.
 *
 * @remarks
 * Пустое или нечисловое поле даёт умолчание. Потолок 95: совсем сплошная
 * вуаль прячет фото, и поле теряет смысл.
 */
export function veilOpacity(value: number | null | undefined, fallback: number): number {
  const v = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(95, Math.max(0, v)) / 100;
}
