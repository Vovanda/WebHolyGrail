'use client';

import { useEffect } from 'react';
import { MEDIA_RENDITIONS } from 'contracts';

import { readNetworkHints, widthCapFor } from '@/lib/media-network';

/** Кадры, которые наводит помощник: их помечает кубик картинки. */
const SELECTOR = 'img[data-part="media-image"]';

/** Сколько ждать, прежде чем сказать про медленную сеть. */
const SLOW_HINT_MS = 5000;

/**
 * Ступень, с которой начинается показ.
 *
 * @remarks
 * Самая мелкая из нарезанных. Весит десятки килобайт и приходит раньше, чем
 * человек успевает посмотреть на место кадра.
 */
const FIRST_STEP = MEDIA_RENDITIONS[0].width;

/**
 * Наведение кадров на резкость.
 *
 * @remarks
 * Делает только то, что известно браузеру и не известно серверу: какое
 * у зрителя соединение и пришёл ли кадр.
 *
 * Показ идёт ступенями. Сперва помощник просит мелкую ступень - она приходит
 * за доли секунды, и на месте кадра сразу стоит картинка, а не размытое пятно.
 * Как только она пришла, он возвращает настоящую подсказку о месте, и браузер
 * догружает нужную ступень поверх. Кадр при этом не двигается и не меняет
 * размеров: меняется только резкость, поэтому подмены как рывка не видно.
 *
 * Разметка так не умеет: сервер о сети зрителя не знает, а заявить мелкий
 * размер всем - значит оставить с мылом тех, у кого сеть хорошая.
 *
 * Ещё помощник помечает кадр, который не пришёл за несколько секунд: у него
 * проступает надпись. Размытое пятно без объяснения читается как поломка.
 *
 * Стоит один раз в раскладке сайта. Сам ничего не рисует.
 */
export function MediaReveal() {
  useEffect(() => {
    const cap = widthCapFor(readNetworkHints());

    /*
      Показ начинается с мелкой ступени. Успевает это только для кадров,
      которые ещё не начали грузиться: у начавшего запрос уже ушёл, и трогать
      его подсказку значит заказать второй файл без всякой пользы.

      На слабой сети мельче берётся и потолок: там крупная ступень идёт
      так долго, что ждать её незачем.
    */
    const first = cap === null ? FIRST_STEP : Math.min(cap, FIRST_STEP);
    document.querySelectorAll<HTMLImageElement>(SELECTOR).forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        /*
          Кадр уже в кеше и готов: заготовке под ним показываться незачем -
          снимаем её сразу, без затухания, иначе размытие мигает на каждом
          обновлении страницы.
        */
        const frame = img.closest('[data-part="media-image-frame"]');
        if (frame instanceof HTMLElement) frame.dataset['ready'] = 'now';
        return;
      }
      if (img.sizes) img.sizes = `${first}px`;
    });

    const frameOf = (node: Element | null) =>
      node?.closest('[data-part="media-image-frame"]') ?? null;

    /*
      Пришла первая ступень - возвращаем настоящую подсказку о месте, и браузер
      догружает нужную. Делается это один раз: подсказка стирается, и повторный
      приход уже ничего не переключает.
    */
    const stepUp = (img: HTMLImageElement) => {
      const place = img.dataset['place'];
      if (!place) return;
      if (cap !== null && cap < FIRST_STEP) return;
      delete img.dataset['place'];
      img.sizes = place;
    };

    /** Кадр пришёл: надпись о сети больше не нужна, заготовка гаснет. */
    const arrived = (node: Element | null) => {
      const frame = frameOf(node);
      if (!(frame instanceof HTMLElement)) return;
      delete frame.dataset['slow'];
      if (!frame.dataset['ready']) frame.dataset['ready'] = 'fade';
    };

    const onLoad = (event: Event) => {
      /*
        Слушаем весь документ, а событие «ошибка» кидает не только картинка:
        плеер шлёт своё, и цель у него - не узел разметки вовсе. Поэтому
        сначала проверяем, что перед нами элемент, и только потом спрашиваем
        его о совпадении.
      */
      const target = event.target;
      if (!(target instanceof Element) || !target.matches(SELECTOR)) return;
      /*
        Обрыв на половине - не то же, что «идёт долго»: ждать больше нечего,
        и надпись должна сказать именно это.
      */
      if (event.type === 'error') {
        const frame = frameOf(target);
        if (frame instanceof HTMLElement) frame.dataset['failed'] = '';
      } else if (target instanceof HTMLImageElement) {
        stepUp(target);
      }
      arrived(target);
    };

    document.addEventListener('load', onLoad, true);
    document.addEventListener('error', onLoad, true);

    const hint = window.setTimeout(() => {
      document.querySelectorAll<HTMLImageElement>(SELECTOR).forEach((img) => {
        if (img.complete && img.naturalWidth > 0) return;
        const frame = frameOf(img);
        if (frame instanceof HTMLElement) frame.dataset['slow'] = '';
      });
    }, SLOW_HINT_MS);

    return () => {
      window.clearTimeout(hint);
      document.removeEventListener('load', onLoad, true);
      document.removeEventListener('error', onLoad, true);
    };
  }, []);

  return null;
}
