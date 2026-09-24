import { parseRenditions } from '@/lib/lane';
import { widthsUpTo } from '@/lib/media';
import { readNetworkHints, widthCapFor } from '@/lib/media-network';

import type { Shot } from './types';

/** Кадры, которые лента берёт со страницы. */
const SELECTOR = '[data-zoom]';

/**
 * Кадры страницы: то, что лента показывает крупно.
 *
 * @remarks
 * Единственная забота этого файла - прочитать разметку и отдать кадры. Что
 * из набора годится на такой сети и как считается место для кнопок, решают
 * чистые функции в `lib`; здесь только чтение разметки.
 *
 * Собирается в момент нажатия, а не заранее: на странице могли появиться новые
 * картинки - догрузился список, раскрылся свёрнутый кусок, - и лента обязана
 * их учесть. Порядок берётся из разметки, то есть совпадает с тем, что человек
 * видит сверху вниз.
 *
 * Картинка внутри ссылки пропускается: у неё уже есть своё действие - переход,
 * и отнимать его нельзя.
 */
export function collectShots(): { shots: Shot[]; nodes: Element[] } {
  const nodes = Array.from(document.querySelectorAll(SELECTOR)).filter((node) => {
    const link = node.closest('a');
    return !link || link.hasAttribute('data-zoom-link');
  });
  const cap = widthCapFor(readNetworkHints());

  const shots = nodes.map((node): Shot => {
    const set = widthsUpTo(parseRenditions(node.getAttribute('data-zoom') ?? ''), cap);
    const largest = set.at(-1)?.url ?? '';
    /*
      Первым показывается тот вариант, который уже стоит на странице: он лежит
      в кеше браузера, поэтому лента открывается и листается мгновенно, без
      похода в сеть. Крупный подтянется следом - его лента возьмёт из набора.
    */
    const shown = node instanceof HTMLImageElement ? node.currentSrc : '';

    return {
      src: shown || largest,
      set,
      file: node.getAttribute('data-zoom-full') ?? largest,
      blur: node.getAttribute('data-zoom-blur') ?? '',
      alt: node.getAttribute('alt') ?? '',
      title: node.getAttribute('data-zoom-title') ?? '',
      note: node.getAttribute('data-zoom-note') ?? '',
      width: Number(node.getAttribute('width')) || 0,
      height: Number(node.getAttribute('height')) || 0,
    };
  });

  return { shots, nodes };
}
