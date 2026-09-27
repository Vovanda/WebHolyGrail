import type { CSSProperties } from 'react';
import type { PageBackgroundSettings } from 'contracts';

import { MediaImage } from '@/blocks/primitives/Media';
import { veilOpacity } from '@/lib/veil';

/**
 * Фон страницы: картинка на всю ширину под всем содержимым сайта.
 *
 * @remarks
 * Слой закреплён за окном и не прокручивается: содержимое едет поверх него,
 * а фон остаётся на месте, как у страницы в целом, а не у одной секции.
 *
 * Картинка видна там, где содержимое не залито своим цветом: вокруг листа
 * раскладки, в промежутках между секциями. Секции со своей заливкой её
 * закрывают - текст остаётся на подложке и читается на любом снимке.
 *
 * Своя картинка для тёмной темы не обязательна: без неё показывается та же.
 */
export function PageBackdrop({
  background,
}: {
  readonly background?: PageBackgroundSettings | undefined;
}) {
  const light = background?.image ?? null;
  const dark = background?.imageDark ?? null;
  if (!light && !dark) return null;

  const layer = (media: NonNullable<typeof light>, className: string) => (
    <MediaImage
      media={media}
      place="100vw"
      alt=""
      zoom={false}
      // Лениво: скрытую пару другой темы браузер тогда не грузит вовсе, а
      // видимая лежит во весь экран и приходит сразу.
      loading="lazy"
      fetchPriority="low"
      className={`absolute inset-0 h-full w-full bg-transparent object-cover ${className}`}
    />
  );

  /*
    Вуаль цвета фона темы поверх фото: смягчает кадр и связывает его с
    палитрой. Процент задаёт владелец, отдельно для светлой и тёмной темы.
  */
  const veil = veilOpacity(background?.veil, 30);
  const veilDark = veilOpacity(background?.veilDark, 40);

  return (
    <div
      data-part="page-backdrop"
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ '--veil': veil, '--veil-dark': veilDark } as CSSProperties}
    >
      {light && layer(light, dark ? 'page-backdrop-light' : '')}
      {dark && layer(dark, light ? 'page-backdrop-dark' : '')}
      <div
        data-part="page-backdrop-veil"
        className="page-backdrop-veil absolute inset-0 bg-page-bg"
      />
    </div>
  );
}
