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
  /** Своя обложка плейлиста, если владелец её задал. */
  readonly cover?: string | null;
  /** Кадры видео: из них собирается стопка, когда своей обложки нет. */
  readonly covers?: ReadonlyArray<string>;
  readonly className?: string;
}

/** Насколько сдвинут каждый следующий слой стопки. */
const STEP = 7;

export function PlaylistCover({ cover, covers = [], className }: PlaylistCoverProps) {
  if (cover) {
    return (
      <img
        data-part="card-thumb"
        src={cover}
        alt=""
        className={cn('aspect-video w-full object-cover', className)}
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
      {layers.map((url, index) => {
        // Считаем от конца: у верхнего слоя сдвиг нулевой.
        const depth = layers.length - 1 - index;
        return (
          <img
            key={url}
            data-part="card-thumb"
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full rounded-lg object-cover shadow-sm transition-transform"
            style={{
              transform: `translate(${depth * STEP}px, ${depth * -STEP}px) scale(${1 - depth * 0.04})`,
              opacity: depth === 0 ? 1 : 0.55 - depth * 0.1,
            }}
          />
        );
      })}
    </span>
  );
}
