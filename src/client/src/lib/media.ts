import type { FrameAspect, MediaDoc, MediaRef, MediaRenditionName } from 'contracts';
import { MEDIA_RENDITIONS, frameAspectOf } from 'contracts';

import { absoluteUrl } from './cms-url';

/**
 * Адрес файла для показа, абсолютный.
 *
 * @remarks
 * Пусто, если ссылка не развёрнута: номер записи без документа адреса не даёт.
 */
export function resolveMediaUrl(ref: MediaRef | null | undefined): string | null {
  if (!ref || typeof ref !== 'object') return null;
  const url = (ref as MediaDoc).url;
  return url ? absoluteUrl(url) : null;
}

/**
 * Вариант файла, готовый к показу: адрес и ширина в точках.
 */
export interface MediaRendition {
  readonly url: string;
  readonly width: number;
}

/**
 * Варианты картинки от мелкого к крупному.
 *
 * @remarks
 * Нарезку делает CMS при заливке, и до этого места она доезжает полями `sizes`.
 * Берём только те, у которых есть адрес и ширина: незаполненный вариант Payload
 * отдаёт объектом с пустыми полями, а не отсутствующим ключом.
 *
 * Оригинал в перечень не попадает намеренно. Он может быть впятеро крупнее
 * самого большого варианта, и на широком экране браузер выбрал бы именно его -
 * ровно то, от чего перечень и заводится. Оригинал остаётся запасным адресом
 * для файла, у которого вариантов нет вовсе.
 */
export function mediaRenditions(ref: MediaRef | null | undefined): MediaRendition[] {
  if (!ref || typeof ref !== 'object') return [];
  const sizes = (ref as MediaDoc).sizes;
  if (!sizes) return [];
  const out: MediaRendition[] = [];
  for (const size of Object.values(sizes)) {
    const url = size?.url;
    const width = size?.width;
    if (!url || !width) continue;
    out.push({ url: absoluteUrl(url), width });
  }
  out.sort((a, b) => a.width - b.width);
  return out;
}

/**
 * Перечень вариантов в том виде, в каком его читает браузер.
 *
 * @remarks
 * Пусто, когда вариантов нет: атрибут тогда не ставится вовсе, иначе браузер
 * получит пустую строку и потеряет картинку.
 */
export function mediaSrcSet(renditions: readonly MediaRendition[]): string | undefined {
  if (renditions.length === 0) return undefined;
  return renditions.map((r) => `${r.url} ${r.width}w`).join(', ');
}

/**
 * Адрес для браузера, который перечня не понимает.
 *
 * @remarks
 * Самый крупный вариант, а при их отсутствии - сам файл. Перечень, если он есть,
 * главнее, поэтому на вес страницы этот адрес не влияет.
 */
export function mediaFallbackUrl(
  ref: MediaRef | null | undefined,
  renditions: readonly MediaRendition[],
): string | null {
  const largest = renditions.at(-1);
  return largest ? largest.url : resolveMediaUrl(ref);
}

/**
 * Самый мелкий адрес файла: для служебного слоя, который не рассматривают.
 *
 * @remarks
 * Размытая подложка по краям кадра и невидимая мерка высоты показывают тот же
 * снимок, но разглядеть в них ничего нельзя - подложка размыта, мерка скрыта.
 * Крупный вариант там - это мегабайты за то, чего никто не увидит, поэтому
 * берётся мельчайшая ступень, а сам файл - только когда ступеней нет вовсе.
 */
export function mediaSmallestUrl(ref: MediaRef | null | undefined): string | null {
  const smallest = mediaRenditions(ref).at(0);
  return smallest ? smallest.url : resolveMediaUrl(ref);
}

/**
 * Набор, обрезанный выбором владельца.
 *
 * @remarks
 * Ступень под место выбирает браузер, но про сам снимок владелец знает больше:
 * общий план читается и мелким, а весит втрое меньше. Выбранная ступень
 * ограничивает набор сверху - всё, что крупнее, из него уходит.
 *
 * Пусто или имя ступени, которой у файла нет, ничего не меняет: пустой выбор -
 * обычный случай, а список ступеней со временем правится, и старое имя
 * не должно гасить показ.
 */
export function mediaUpTo(
  renditions: readonly MediaRendition[],
  step: MediaRenditionName | null | undefined,
): MediaRendition[] {
  const limit = MEDIA_RENDITIONS.find((known) => known.name === step)?.width;
  return widthsUpTo(renditions, limit ?? null);
}

/**
 * Варианты не шире предела; если шире все - мельчайший.
 *
 * @remarks
 * Один вариант остаётся всегда: без него показывать нечего. Предела нет -
 * набор идёт целиком. Набор ждётся отсортированным от мелкого к крупному.
 */
export function widthsUpTo<T extends { readonly width: number }>(
  list: readonly T[],
  limit: number | null,
): T[] {
  if (limit === null) return [...list];
  const fit = list.filter((one) => one.width <= limit);
  return fit.length > 0 ? fit : list.slice(0, 1);
}

/**
 * Место карточки в сетке для выбора ступени.
 *
 * @remarks
 * Карточка идёт по три-четыре в ряд - около трети содержательной ширины, -
 * а на узком экране во всю ширину. Одно значение на все сетки карточек.
 */
export const CARD_PLACE = '(max-width: 768px) 100vw, 400px';

/** Ширина ступени нарезки в точках. */
export function stepWidth(name: MediaRenditionName): number {
  return MEDIA_RENDITIONS.find((step) => step.name === name)?.width ?? 0;
}

export type { FrameAspect };

/**
 * Форма одиночного кадра по документу медиатеки.
 *
 * @remarks
 * Само правило - в `frameAspectOf` из contracts: по нему же редактор статьи
 * показывает кадр той формой, что увидит читатель. Номер записи без
 * документа формы не даёт.
 */
export function singleFrameAspect(ref: MediaRef | null | undefined): FrameAspect | undefined {
  return frameAspectOf(ref && typeof ref === 'object' ? ref : null);
}

/** Всё, что кубику картинки нужно знать о кадре, посчитанное из документа. */
export interface MediaFrame {
  /** Адрес для браузера без перечня. */
  readonly src: string;
  /** Перечень ступеней для потока страницы, в пределах `pageStep`. */
  readonly srcSet: string | undefined;
  /** Сам файл: открывается кнопкой и служит ссылкой до прихода ленты. */
  readonly file: string | null;
  /** Перечень для ленты, в пределах `laneStep`; без предела с самим файлом. */
  readonly laneSet: string;
  /** Размытая заготовка строкой. */
  readonly blur: string | null;
  /** Точка подрезки владельца в процентах, `x% y%`. */
  readonly focus: string | undefined;
  /** Форма рамки: заданная местом, иначе форма снимка. */
  readonly shape: FrameAspect | undefined;
}

/**
 * Кадр для показа: ступени страницы и ленты, заготовка, точка подрезки, форма.
 *
 * @remarks
 * У страницы и у ленты свои пределы: в потоке кадр может идти мелким, а
 * рассматривают его крупным, и наоборот - тяжёлый скан незачем тянуть даже при
 * открытии. Без предела ленты в её перечень добавляется сам файл: на мониторе
 * лента возьмёт его, на телефоне обойдётся ступенью.
 *
 * Пусто, если у документа нет адреса: рисовать нечего.
 */
export function mediaFrame(
  media: MediaRef | null | undefined,
  aspect?: FrameAspect,
): MediaFrame | null {
  const doc = media && typeof media === 'object' ? (media as MediaDoc) : null;
  const all = mediaRenditions(media);
  const page = mediaUpTo(all, doc?.pageStep);
  const src = mediaFallbackUrl(media, page);
  if (!src) return null;

  const file = resolveMediaUrl(media);
  const lane = mediaUpTo(all, doc?.laneStep);
  const laneWithFile =
    file && doc?.width && !doc.laneStep ? [...lane, { url: file, width: doc.width }] : lane;

  return {
    src,
    srcSet: mediaSrcSet(page),
    file,
    laneSet: mediaSrcSet(laneWithFile) ?? src,
    blur: doc?.blurData ?? null,
    focus:
      typeof doc?.focalX === 'number' && typeof doc.focalY === 'number'
        ? `${doc.focalX}% ${doc.focalY}%`
        : undefined,
    shape:
      aspect ?? (doc?.width && doc.height ? { width: doc.width, height: doc.height } : undefined),
  };
}
