import type { MediaRef } from 'contracts';

import { MediaImage } from '@/blocks/primitives/Media';
import { cn } from '@/lib/utils';

/**
 * Лицо плейлиста: своя обложка или стопка кадров.
 *
 * @remarks
 * Своей обложки у плейлиста может не быть вовсе, а пустое место там, где у
 * соседей картинка, читается как поломка. Поэтому собираем лицо из кадров
 * самих видео и кладём их стопкой со сдвигом, как колоду: сразу видно, что
 * это подборка, а не одно видео.
 *
 * Верхним лежит первый кадр - с него плейлист и начинают смотреть. Нижние
 * приглушены и сдвинуты: они здесь не ради разглядывания, а ради глубины.
 *
 * Кадров нет вовсе - остаётся ровная заливка. Рисовать пустую стопку незачем:
 * она обещает содержимое, которого не будет.
 */
export interface PlaylistCoverProps {
  /**
   * Своя обложка плейлиста, если владелец её задал.
   *
   * @remarks
   * Документ или готовый адрес. По документу показ берёт ступень под размер
   * карточки; строка остаётся рабочей ради того, что собрано раньше.
   */
  readonly cover?: MediaRef | string | null;
  /** Кадры видео: из них собирается стопка, когда своей обложки нет. */
  readonly covers?: ReadonlyArray<MediaRef | string>;
  readonly className?: string;
}

/** Место обложки в карточке: по нему выбирается ступень. */
const PLACE = '(max-width: 768px) 50vw, 320px';

/** Адрес для того случая, когда пришла строка, а не документ. */
function urlOf(source: MediaRef | string): string {
  return typeof source === 'string' ? source : ((source as { url?: string }).url ?? '');
}

/** Насколько сдвинут каждый следующий слой стопки. */
const STEP = 7;

export function PlaylistCover({ cover, covers = [], className }: PlaylistCoverProps) {
  if (cover) {
    return typeof cover === 'string' ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        data-part="card-thumb"
        src={cover}
        alt=""
        className={cn('aspect-video w-full object-cover', className)}
      />
    ) : (
      <MediaImage
        media={cover}
        place={PLACE}
        alt=""
        className={cn('aspect-video w-full object-cover', className)}
        zoom={false}
      />
    );
  }

  if (covers.length === 0) {
    return <span className={cn('aspect-video w-full bg-surface', className)} aria-hidden="true" />;
  }

  // Рисуем с конца: первый кадр должен оказаться сверху, а порядок в разметке
  // задаёт и порядок наложения.
  const layers = [...covers].slice(0, 3).reverse();

  return (
    <span
      className={cn('relative block aspect-video w-full overflow-hidden bg-surface', className)}
      aria-hidden="true"
    >
      {layers.map((layer, index) => {
        // Считаем от конца: у верхнего слоя сдвиг нулевой.
        const depth = layers.length - 1 - index;
        const look = {
          transform: `translate(${depth * STEP}px, ${depth * -STEP}px) scale(${1 - depth * 0.04})`,
          opacity: depth === 0 ? 1 : 0.55 - depth * 0.1,
        };
        const shape =
          'absolute inset-0 h-full w-full rounded-lg object-cover shadow-sm transition-transform';
        /*
          Сдвиг слоя висит на обёртке, а не на самом кадре: кубик своего стиля
          в разметке не принимает - он перебил бы вид, который владелец задал
          блоку.
        */
        return (
          <span key={urlOf(layer)} className="absolute inset-0" style={look}>
            {typeof layer === 'string' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img data-part="card-thumb" src={layer} alt="" className={shape} />
            ) : (
              <MediaImage media={layer} place={PLACE} alt="" className={shape} zoom={false} />
            )}
          </span>
        );
      })}
    </span>
  );
}
