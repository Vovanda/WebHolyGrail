'use client';

import { CarouselDeck, CarouselItem } from './CarouselDeck';
import type { CarouselProps } from './types';
import { PhotoLightbox } from '@/blocks/primitives/PhotoLightbox';

/**
 * Карусель снимков поверх общего примитива.
 *
 * @remarks
 * Примитив листает что угодно и о картинках ничего не знает. Всё, что нужно
 * именно снимкам, живёт здесь: вписывать кадр целиком или обрезать по краям,
 * держать высоту по первому кадру, закрывать поля по бокам размытой копией,
 * открывать снимок крупно.
 *
 * Так у листания одна механика на весь сайт, а особенности снимков не тянутся
 * в примитив и не мешают тем, кто листает карточки или блоки.
 */
export function PhotoDeck(props: CarouselProps) {
  if (props.lightboxGroupId) {
    const { lightboxGroupId, ...rest } = props;
    return (
      <PhotoLightbox
        slides={props.slides.map((s) => ({ src: s.url, alt: s.alt }))}
        groupId={lightboxGroupId}
      >
        {(open: (index: number) => void) => <PhotoDeckInner {...rest} onPick={open} />}
      </PhotoLightbox>
    );
  }
  return <PhotoDeckInner {...props} />;
}

function PhotoDeckInner({
  slides,
  period,
  arrows = false,
  objectFit = 'contain',
  backdropBlur = false,
  aspect,
  height,
  heightFromFirstSlide = false,
  background = 'transparent',
  rounded,
  onPick,
}: CarouselProps & { readonly onPick?: (index: number) => void }) {
  if (slides.length === 0) return null;

  /*
    Высота по первому кадру: невидимая копия первого снимка задаёт её собой,
    а сами кадры ложатся поверх. Иначе баннеры разной формы дёргали бы страницу
    на каждом повороте.
  */
  const byFirst = heightFromFirstSlide && !height && !aspect;
  const fit = byFirst ? 'cover' : objectFit;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background,
        borderRadius: rounded,
        ...(height ? { height } : aspect ? { aspectRatio: aspect } : null),
      }}
    >
      {byFirst && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={slides[0]!.url}
          alt=""
          aria-hidden
          draggable={false}
          className="block w-full select-none invisible pointer-events-none"
        />
      )}

      <CarouselDeck
        mode="single"
        arrows={arrows}
        loop
        autoplay={period}
        gap="sm"
        className={byFirst ? 'absolute inset-0' : ''}
        height={byFirst ? '100%' : undefined}
      >
        {slides.map((slide, i) => (
          <CarouselItem key={`${slide.url}-${i}`} width="full" className="relative">
            {/*
              Поля по бокам закрывает та же картинка, размытая и увеличенная:
              вписанный целиком кадр иначе висит на пустой полосе.
            */}
            {backdropBlur && fit === 'contain' && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={slide.url}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-0 h-full w-full select-none pointer-events-none object-cover"
                style={{ filter: 'blur(24px) brightness(0.85)', transform: 'scale(1.15)' }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              data-part="media"
              src={slide.url}
              alt={slide.alt}
              draggable={false}
              onClick={onPick ? () => onPick(i) : undefined}
              className={`relative block w-full select-none ${onPick ? 'cursor-zoom-in' : ''}`}
              style={{
                height: byFirst || height || aspect ? '100%' : 'auto',
                objectFit: fit,
              }}
            />
          </CarouselItem>
        ))}
      </CarouselDeck>
    </div>
  );
}
