'use client';

import type { MediaRef } from 'contracts';
import { useState } from 'react';

import { MediaImage } from '@/blocks/primitives/Media';
import { MediaPlaceholder } from '@/blocks/primitives/Media/MediaPlaceholder';

/**
 * Галерея страницы товара: превью столбиком слева, выбранный кадр крупно.
 *
 * @remarks
 * Как у Озона и ВсеИнструменты: превью меняет большой кадр по наведению и
 * нажатию, большой кадр открывается на весь экран. На узком экране превью идут
 * строкой под кадром. Без картинок - рамка с иконкой той же высоты.
 *
 * Части: `offer-gallery`, `offer-gallery-main`, `offer-gallery-thumb`.
 */
export function OfferGallery({
  files,
  title,
}: {
  readonly files: readonly MediaRef[];
  readonly title: string;
}) {
  const [at, setAt] = useState(0);
  const current = files[at] ?? files[0];
  return (
    <div data-part="offer-gallery" className="flex flex-col-reverse gap-3 md:flex-row">
      {files.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto md:max-h-[32rem] md:flex-col md:overflow-y-auto">
          {files.map((file, i) => (
            <li key={i} className="shrink-0">
              <button
                type="button"
                data-part="offer-gallery-thumb"
                aria-label={`Кадр ${i + 1} из ${files.length}`}
                aria-current={i === at ? 'true' : undefined}
                onClick={() => setAt(i)}
                onMouseEnter={() => setAt(i)}
                className={`block size-16 overflow-hidden rounded-lg border-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                  i === at ? 'border-accent' : 'border-transparent hover:border-border-strong'
                }`}
              >
                <MediaImage
                  media={file}
                  place="64px"
                  alt=""
                  zoom={false}
                  className="h-full w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div
        data-part="offer-gallery-main"
        className="aspect-square min-w-0 flex-1 overflow-hidden rounded-2xl bg-surface"
      >
        {current ? (
          <MediaImage
            key={at}
            media={current}
            place="(max-width: 767px) 100vw, 560px"
            alt={title}
            className="h-full w-full object-contain"
          />
        ) : (
          <MediaPlaceholder size={56} />
        )}
      </div>
    </div>
  );
}
