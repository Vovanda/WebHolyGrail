/**
 * Счётная часть ленты: разбор набора вариантов и место для кнопок.
 *
 * @remarks
 * Здесь нет ни разметки, ни браузера - только числа и строки, поэтому всё это
 * проверяется без запуска сайта. Лента сверху берёт готовые значения и занята
 * своим делом: показывает кадр и слушает человека.
 */

import type { MediaRendition } from './media';

/**
 * Разбор перечня вариантов, который кубик положил рядом с картинкой.
 *
 * @remarks
 * Формат тот же, в каком его читает браузер: адрес, пробел, ширина с буквой w,
 * через запятую. Испорченные куски отбрасываются - лучше показать кадр
 * из уцелевших, чем не показать ничего.
 */
export function parseRenditions(value: string): MediaRendition[] {
  return value
    .split(',')
    .map((chunk) => {
      const [url, width] = chunk.trim().split(/\s+/);
      return { url: url ?? '', width: Number.parseInt(width ?? '0', 10) || 0 };
    })
    .filter((item) => item.url && item.width > 0)
    .sort((a, b) => a.width - b.width);
}

/** Пропорции кадра: по ним считается место, которое он займёт. */
export interface FrameShape {
  readonly width: number;
  readonly height: number;
}

/** Вариант в том виде, в каком его принимает лента: с шириной и высотой. */
export interface LaneSource {
  readonly src: string;
  readonly width: number;
  readonly height: number;
}

/**
 * Набор вариантов для ленты.
 *
 * @remarks
 * Лента выбирает вариант по размеру полотна и сверяет обе стороны, поэтому
 * высота считается по пропорции кадра. Без размеров кадра пропорция неизвестна,
 * и вариант считается квадратным - ширина при этом остаётся верной.
 */
export function laneSources(set: readonly MediaRendition[], shape: FrameShape): LaneSource[] {
  const ratio = shape.width > 0 && shape.height > 0 ? shape.height / shape.width : 1;
  return set.map((one) => ({
    src: one.url,
    width: one.width,
    height: Math.round(one.width * ratio),
  }));
}

/** Окно зрителя. */
export interface Viewport {
  readonly width: number;
  readonly height: number;
}

/**
 * Полотно показа: доля высоты экрана, предел по ширине и пропорция.
 *
 * @remarks
 * Высота - узкое место показа: ширины на мониторе с запасом, а по высоте кадр
 * упирается первым. Доля меньше единицы оставляет поле сверху и снизу, и по
 * нему видно, что кадр лежит поверх страницы, а не заменил её собой.
 *
 * Ширина полотна - четыре к трём от его высоты: самая высокая из лежачих
 * пропорций. Горизонтальный кадр любой вытянутости доходит до боковых краёв
 * полотна, вертикальный упирается в высоту и остаётся уже - но полотно одно
 * и то же, поэтому стрелки стоят там, где стояли бы при полной ширине.
 */
const OF_HEIGHT = 0.8;
const OF_WIDTH = 0.9;
const SHAPE = 4 / 3;

/** Полотно показа: его размеры и края на экране. */
export interface LaneFrame {
  readonly width: number;
  readonly height: number;
  /** Отступ от левого края экрана до полотна. */
  readonly left: number;
  readonly right: number;
  /** Нижняя граница полотна, считая от верха экрана: к ней прижата подпись. */
  readonly bottom: number;
}

/**
 * Полотно, в котором показывается кадр.
 *
 * @remarks
 * Полотно одно на все снимки и считается от окна, а не от кадра: по его краям
 * стоят стрелки, счётчик и подпись, и при листании им незачем двигаться.
 * Края по самому снимку ехали бы при каждом листании: кадры идут разной ширины.
 *
 * Полотно становится самим экраном в двух случаях: при приближении и там, где
 * на поля по бокам места нет вовсе. Второе - это телефон и планшет стоймя:
 * полотно с полями отняло бы у кадра половину и без того небольшого экрана.
 * Планшет лёжа и монитор поля получают: там ширины хватает.
 */
export function laneFrame({
  viewport,
  zoomed = false,
}: {
  readonly viewport: Viewport;
  readonly zoomed?: boolean;
}): LaneFrame {
  const wanted = viewport.height * OF_HEIGHT * SHAPE;
  const room = viewport.width * OF_WIDTH;

  if (zoomed || wanted > room) {
    return {
      width: viewport.width,
      height: viewport.height,
      left: 0,
      right: 0,
      bottom: viewport.height,
    };
  }

  const width = Math.round(wanted);
  const height = Math.round(width / SHAPE);

  /*
    Края равны между собой, а не досчитываются один из другого: по ним стоит
    обвязка, и разница в точку между левой и правой стрелкой видна, тогда как
    та же точка в сумме с шириной полотна - нет.
  */
  const side = Math.round((viewport.width - width) / 2);

  return {
    width,
    height,
    left: side,
    right: side,
    bottom: Math.round((viewport.height + height) / 2),
  };
}

/**
 * Ступени приближения в ленте: сколько нажатий «+» до упора и во сколько раз
 * каждое.
 *
 * @remarks
 * Число одно на все кадры: у кадра с крупным файлом и у кадра без него
 * «+» нажимается столько же раз. Сверх разрешения файла приближение идёт
 * цифровое - снимок увеличивается дальше своих точек, как в галерее телефона.
 */
export const LANE_ZOOM = { steps: 3, multiplier: 2 } as const;

/**
 * Предел приближения: на четверть ступени ниже последней.
 *
 * @remarks
 * Ровно `multiplier ^ steps` не годится: лента меряет свой слайд без полосы
 * прокрутки, и предел выходит выше на процент-другой - тогда после третьего
 * нажатия оставалось четвёртое на долю. С запасом последнее нажатие упирается
 * в предел при любом таком расхождении, а число нажатий остаётся тем же.
 */
export const LANE_ZOOM_LIMIT = LANE_ZOOM.multiplier ** (LANE_ZOOM.steps - 0.25);

/**
 * Во сколько раз сверх размера файла ленте можно увеличить кадр.
 *
 * @remarks
 * Лента ставит предел приближения сама: ширина файла, умноженная на это число,
 * делённая на ширину кадра на экране. Показанная ширина - кадр, вписанный
 * в окно, но не крупнее файла. Число подбирается так, чтобы предел выходил
 * `LANE_ZOOM_LIMIT` - одинаковым у всех кадров.
 *
 * Без размеров файла предел не посчитать - остаётся единица, как у ленты
 * по умолчанию.
 */
export function laneZoomRatio({
  viewport,
  file,
}: {
  readonly viewport: Viewport;
  readonly file: FrameShape;
}): number {
  if (file.width <= 0 || file.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return 1;
  }
  const shown = Math.min(viewport.width, (viewport.height / file.height) * file.width, file.width);
  return (LANE_ZOOM_LIMIT * shown) / file.width;
}

/**
 * Подпись кнопки самого крупного файла: его разрешение.
 *
 * @remarks
 * Короче слов «максимальный размер» и говорит больше: сколько точек откроется.
 * Без размеров - просто «Файл».
 */
export function fileButtonLabel(width: number, height: number): string {
  return width > 0 && height > 0 ? `${width} × ${height}` : 'Файл';
}
