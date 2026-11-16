'use client';

import { CarouselDeck, CarouselItem } from './CarouselDeck';
import type { CarouselProps, CarouselSlide } from './types';
import { MediaImage } from '@/blocks/primitives/Media';
import { PhotoLightbox } from '@/blocks/primitives/PhotoLightbox';
import { mediaSmallestUrl, resolveMediaUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

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
        slides={props.slides.map((slide) => ({ src: fullUrl(slide) ?? '', alt: slide.alt }))}
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
  place = '100vw',
  zoom = true,
  gap = 'sm',
  pauseOnInteraction = false,
  onPick,
}: CarouselProps & { readonly onPick?: (index: number) => void }) {
  if (slides.length === 0) return null;

  /*
    Высота по первому кадру: невидимая копия первого снимка задаёт её собой,
    а сами кадры ложатся поверх. Иначе баннеры разной формы дёргали бы страницу
    на каждом повороте.
  */
  const byFirst = heightFromFirstSlide && !height && !aspect;
  /* Высота ленты задана снаружи: рамкой или пропорцией места. */
  const fixed = Boolean(height) || Boolean(aspect);
  const fit = byFirst ? 'cover' : objectFit;

  return (
    /*
      Потолок высоты стоит на самом месте, а не на кадре: кадр о высоте места
      не знает, и предел, повешенный на него, вертикальный снимок из рамки
      не удержит. Место ограничено - кадр вписывается в него целиком.

      Предел общий на шаблон и настройкой не открывается: размер места задаёт
      тот, кто ставит ленту, а потолок один для всех.
    */
    <div
      className="relative min-w-0"
      style={{
        background,
        borderRadius: rounded,
        maxHeight: 'var(--media-single-max-h)',
        ...(height ? { height } : aspect ? { aspectRatio: aspect } : null),
      }}
    >
      {byFirst && (
        /*
          Мерку высоты задаёт невидимая копия первого кадра: её видно только
          по занятому месту, поэтому берётся мельчайшая ступень - пропорции
          у неё те же, а вес в разы меньше.
        */
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={serviceUrl(slides[0]!) ?? ''}
          alt=""
          aria-hidden
          draggable={false}
          className="block w-full select-none invisible pointer-events-none max-h-[var(--media-single-max-h)]"
        />
      )}

      {/*
        Заданная снаружи высота доходит до самой ленты, а не только до рамки
        вокруг неё: иначе кадр идёт натуральной высотой, вылезает за обрезку,
        и стрелки - они считаются от ленты - оказываются ниже видимой части.
      */}
      <CarouselDeck
        mode="single"
        arrows={arrows}
        loop
        autoplay={period}
        gap={gap}
        rounded={rounded}
        pauseOnInteraction={pauseOnInteraction}
        className={byFirst ? 'absolute inset-0' : fixed ? 'h-full' : ''}
        height={byFirst || fixed ? '100%' : undefined}
      >
        {slides.map((slide, i) => (
          /* Кадр по центру места: вокруг него ровные поля, в них и стоят стрелки. */
          <CarouselItem key={i} width="full" className="relative flex items-center justify-center">
            {/*
              Поля по бокам закрывает та же картинка, размытая и увеличенная:
              вписанный целиком кадр иначе висит на пустой полосе. Разглядеть
              в ней нечего, поэтому и здесь идёт мельчайшая ступень.
            */}
            {backdropBlur && fit === 'contain' && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={serviceUrl(slide) ?? ''}
                alt=""
                aria-hidden
                draggable={false}
                className="absolute inset-0 h-full w-full select-none pointer-events-none object-cover"
                style={{ filter: 'blur(24px) brightness(0.85)', transform: 'scale(1.15)' }}
              />
            )}
            <Frame
              slide={slide}
              place={place}
              fit={fit}
              full={byFirst || Boolean(height) || Boolean(aspect)}
              zoom={zoom}
              {...(onPick ? { onPick: () => onPick(i) } : {})}
            />
          </CarouselItem>
        ))}
      </CarouselDeck>
    </div>
  );
}

/**
 * Кадр слайда: из медиатеки кубиком, по адресу - как прежде.
 *
 * @remarks
 * Открытие крупно у слайда своё - его ведёт сама лента, - поэтому кубику оно
 * отключается: иначе за одно нажатие берутся два показа, и открывается то,
 * которое успело первым.
 */
function Frame({
  slide,
  place,
  fit,
  full,
  zoom,
  onPick,
}: {
  readonly slide: CarouselSlide;
  readonly place: string;
  readonly fit: 'cover' | 'contain';
  readonly full: boolean;
  readonly zoom: boolean;
  readonly onPick?: () => void;
}) {
  /*
    Два случая, и оба про одно: ширина поля не должна прыгать от кадра к кадру.

    Высота или пропорция места задана - кадр заполняет её (`h-full w-full`),
    поля вокруг одинаковы у всех слайдов, в них и стоят стрелки.

    Место высотой не задано - кадр вписывается по своей пропорции под общий
    потолок снимка: упёршись в него, он сужается и встаёт по центру. Потолок
    висит на самом кадре, а не только на обёртке: у обёртки высота авто, и
    процент от неё не считается - без явного предела вертикальный снимок
    уходил бы за нижний край экрана.
  */
  const filled = 'relative block select-none object-contain h-full w-full';

  /*
    Из медиатеки кадр приходит рамкой кубика: своей ширины у неё нет, и
    «по содержимому» она сжимается в ноль. Ширину ей считает общий класс
    одиночного кадра - из потолка и пропорции, которую кубик кладёт переменной.
    У голого адреса такой переменной нет, зато пропорция есть у самой картинки:
    она и сужается под потолок.
  */
  const framed = full ? filled : 'relative block select-none object-contain media-single';
  const bare = full
    ? filled
    : 'relative block select-none object-contain mx-auto w-auto max-w-full max-h-[var(--media-single-max-h)]';

  const picture = slide.media ? (
    <MediaImage
      media={slide.media}
      place={place}
      fit={fit}
      alt={slide.alt}
      className={framed}
      zoom={zoom && !onPick}
    />
  ) : (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      data-part="media"
      src={slide.url ?? ''}
      alt={slide.alt}
      draggable={false}
      className={bare}
    />
  );

  if (!onPick) return picture;

  return (
    <button
      type="button"
      data-part="media"
      onClick={onPick}
      aria-label={slide.alt ? `Увеличить: ${slide.alt}` : 'Увеличить снимок'}
      className={cn(
        'm-0 block w-full cursor-zoom-in border-0 bg-transparent p-0',
        full && 'h-full',
      )}
    >
      {picture}
    </button>
  );
}

/** Адрес самого файла: он нужен там, где кадр открывают крупно. */
function fullUrl(slide: CarouselSlide): string | null {
  return resolveMediaUrl(slide.media) ?? slide.url ?? null;
}

/** Адрес для служебного слоя: мерки высоты и размытой подложки. */
function serviceUrl(slide: CarouselSlide): string | null {
  return mediaSmallestUrl(slide.media) ?? slide.url ?? null;
}
