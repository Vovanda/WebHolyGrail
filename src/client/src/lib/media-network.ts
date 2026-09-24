import { stepWidth } from './media';

/**
 * Что известно о соединении зрителя.
 *
 * @remarks
 * Браузер сообщает это сам, когда умеет: тип соединения и просьбу экономить
 * трафик. Где не умеет - полей нет, и решения принимаются как для обычной сети.
 *
 * Тип описан здесь, а не взят из библиотеки: в стандартных типах этих полей
 * нет, а завязываться на чужой пакет ради трёх свойств ни к чему.
 */
export interface NetworkHints {
  /** `slow-2g` | `2g` | `3g` | `4g`, как их называет браузер. */
  readonly effectiveType?: string | undefined;
  /** Зритель попросил экономить трафик. */
  readonly saveData?: boolean | undefined;
}

/**
 * Предел ширины кадра, выше которого на такой сети просить не стоит.
 *
 * @remarks
 * Двести килобит - это двадцать пять килобайт в секунду: вариант на 1200 точек
 * идёт секунды три, а страница со снимками - минуту. Вариант помельче приходит
 * за полсекунды, и человек видит кадры, а не размытые пятна.
 *
 * Без предела (`null`) сеть считается обычной: ограничивать нечего, вариант
 * выбирает браузер по вёрстке и плотности экрана.
 */
export function widthCapFor(hints: NetworkHints | null | undefined): number | null {
  if (!hints) return null;
  if (hints.saveData) return stepWidth('thumbnail');

  switch (hints.effectiveType) {
    case 'slow-2g':
    case '2g':
      return stepWidth('thumbnail');
    case '3g':
      return stepWidth('card');
    default:
      return null;
  }
}

/** Сведения о соединении, если браузер их даёт. */
export function readNetworkHints(): NetworkHints | null {
  if (typeof navigator === 'undefined') return null;
  const connection = (navigator as Navigator & { connection?: NetworkHints }).connection;
  return connection ?? null;
}
