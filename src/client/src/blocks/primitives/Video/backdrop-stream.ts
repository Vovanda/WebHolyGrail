import { createKeyLoader } from './key-loader';

/**
 * Подключает нарезку к кадру фона.
 *
 * @remarks
 * Модуль грузится по требованию: библиотека разбора весит заметно, а обложка -
 * первый экран, и страница без видео не должна за неё платить (R7).
 *
 * Safari играет нарезку сам, и подменять его разбором на своей стороне незачем:
 * встроенный проигрыватель экономнее и знает про энергосбережение телефона.
 *
 * Ключ шифрования берётся тем же загрузчиком, что и у плеера: нарезка закрыта
 * даже у открытой записи, и без ключа фон остался бы чёрным. Отказ фон
 * не показывает - на его месте остаётся постер, а объяснять зрителю нечего:
 * он на обложку не нажимал.
 */
export async function attachStream(video: HTMLVideoElement, src: string): Promise<() => void> {
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = src;
    return () => {
      video.removeAttribute('src');
      video.load();
    };
  }

  const { default: Hls } = await import('hls.js');
  if (!Hls.isSupported()) return () => {};

  const hls = new Hls({
    // Нижняя ступень: фон приглушён фильтром и замедлен, разницу в чёткости
    // на нём не разглядеть, а первый кадр появляется заметно раньше.
    startLevel: 0,
    capLevelToPlayerSize: true,
    loader: createKeyLoader({ onFailure: () => {} }),
  });

  hls.loadSource(src);
  hls.attachMedia(video);

  return () => hls.destroy();
}
