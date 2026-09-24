'use client';

import { fileButtonLabel } from '@/lib/lane';
import { cn } from '@/lib/utils';

import { LaneCaption } from './LaneCaption';
import { HALO, ROUND } from './lane-look';
import type { Shot } from './types';

/**
 * Слой поверх ленты: подпись под кадром и кнопка полного размера.
 *
 * @remarks
 * Лежит своим слоем, а не внутри кадра: лента кладёт содержимое слайда в тот
 * же ряд, что и снимок, и подпись оказывалась сбоку от него. Нажатий слой
 * не перехватывает - кроме самой подписи, которую надо уметь раскрыть,
 * и кнопки.
 *
 * Общий у обеих лент: снимок, открытый из карусели, подписан так же, как
 * открытый из текста страницы.
 *
 * Рисуется внутри самой ленты (её место `render.controls`): лента при
 * открытии делает всё остальное на странице недоступным для нажатий
 * (`inert`), и слой, выведенный рядом с ней, пропускал нажатия насквозь -
 * «ещё» приближало кадр, а кнопка файла листала.
 */
export function LaneOverlay({
  shot,
  closing = false,
}: {
  readonly shot: Shot;
  /**
   * Лента закрывается.
   *
   * @remarks
   * Закрытие идёт с затуханием, и всё это время лента ещё на экране. Без
   * признака слой снимался мгновенно, и текст пропадал раньше кадра, рывком.
   */
  readonly closing?: boolean;
}) {
  return (
    <div
      data-part="lane-caption-layer"
      /*
        Слой растёт вверх от нижней границы полотна, а не начинается под ней:
        когда полотно занимает экран целиком - на телефоне и при приближении, -
        привязка сверху уводила текст за нижний край.
      */
      className={cn(
        'pointer-events-none fixed inset-x-0 z-[10000] transition-opacity duration-200',
        'bottom-[calc(100dvh-var(--lane-frame-bottom,100dvh))]',
        closing && 'opacity-0',
      )}
    >
      <LaneCaption shot={shot} />
      {/*
        Кнопка открывает самый крупный файл в отдельной вкладке. Стоит в нижнем
        углу: верх занят счётчиком и кнопками, низ по центру - подписью.
        В самой ленте показывается вариант под экран, он приходит быстро даже
        на слабой сети; полный размер нужен тем, кто хочет разглядеть кадр
        целиком, и тянуть его всем без спроса незачем.

        Подписана разрешением файла, а не словом «оригинал»: у файла, с которого
        убрали исходник ради места, самым крупным служит копия.
      */}
      {shot.file && (
        <a
          href={shot.file}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...ROUND, ...HALO }}
          aria-label={`Открыть файл ${fileButtonLabel(shot.width, shot.height)}`}
          className="pointer-events-auto fixed bottom-4 right-4 inline-flex items-center px-4 py-2 text-sm font-medium leading-none tabular-nums text-on-media-soft no-underline hover:text-on-media"
        >
          {fileButtonLabel(shot.width, shot.height)}
        </a>
      )}
    </div>
  );
}
