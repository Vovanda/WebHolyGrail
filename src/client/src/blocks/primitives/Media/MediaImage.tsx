import type { MediaDoc, MediaRef } from 'contracts';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';
import { mediaFrame, type FrameAspect } from '@/lib/media';

/**
 * Картинка из медиатеки.
 *
 * @remarks
 * Файл лежит в хранилище не в одном виде: при заливке CMS режет его на варианты,
 * и в колонку шириной 768 точек нужен вариант на 768, а не исходный кадр
 * с телефона на 5712. Разницы между ними - десятки раз по весу, поэтому кубик
 * и заводится: правило выбора живёт в одном месте, а не повторяется в каждом
 * блоке, который показывает картинку.
 *
 * Сам кубик ничего не выбирает - перечень вариантов он отдаёт браузеру, а тот
 * берёт подходящий, зная ширину окна и плотность экрана. Всё, что нужно ему
 * сообщить, - сколько места займёт картинка: это `place`, и задаёт его тот,
 * кто ставит кубик, потому что про колонки и панели знает он.
 *
 * Предмета кубик не знает: видит документ и место, а не статью, собаку или
 * услугу.
 */
export function MediaImage({
  media,
  place = '100vw',
  alt,
  className,
  loading = 'lazy',
  fetchPriority,
  decoding,
  zoom = true,
  fit = 'cover',
  aspect,
}: {
  /** Документ медиатеки. Голый номер вместо документа рисовать нечем. */
  readonly media: MediaRef | null | undefined;
  /**
   * Сколько места картинка занимает на экране.
   *
   * @remarks
   * Пишется так же, как в вёрстке: `(max-width: 768px) 100vw, 768px`. По этой
   * строке браузер и выбирает вариант, поэтому неверное значение стоит дороже
   * отсутствующего: сказав `100vw` про картинку в узкой колонке, получим самый
   * крупный вариант там, где хватило бы мелкого.
   */
  readonly place?: string;
  /** Подпись для тех, кто не видит картинку. Своя - главнее той, что у файла. */
  readonly alt?: string;
  readonly className?: string;
  /** `eager` - для той картинки, что видна сразу при открытии страницы. */
  readonly loading?: 'lazy' | 'eager';
  /** `high` - для главного кадра страницы, чтобы он грузился раньше прочего. */
  readonly fetchPriority?: 'high' | 'low' | 'auto';
  /**
   * Когда рисовать кадр.
   *
   * @remarks
   * У кадра с заготовкой по умолчанию `sync`: готовый из кеша снимок рисуется
   * в том же проходе, что и заготовка под ним, и перекрывает её собой. С `async`
   * первый проход ушёл бы с одной заготовкой, и размытие моргало бы при каждом
   * обновлении страницы.
   */
  readonly decoding?: 'async' | 'sync' | 'auto';
  /**
   * Попадает ли картинка в ленту страницы, которая открывается на весь экран.
   *
   * @remarks
   * По умолчанию да: содержательная картинка - обычный случай, и блоку не нужно
   * об этом помнить. Служебной - логотипу, значку, аватару - ставится `false`:
   * открывать её незачем, а в ленте она только мешает.
   *
   * Картинка внутри ссылки не перехватывается и с этим свойством: у неё уже есть
   * своё действие, и отнимать его нельзя. Разбирается это в самой ленте, потому
   * что про окружение картинки знает разметка, а не кубик.
   */
  readonly zoom?: boolean;
  /**
   * Как кадр ложится в рамку заготовки: по краям или целиком.
   *
   * @remarks
   * Работает там, где у файла есть заготовка: рамка тогда держит место, а кадр
   * лежит в ней слоем. Заготовка кадрируется так же, иначе при подмене снимок
   * прыгает - один обрезан по рамке, другой вписан по-своему.
   *
   * Без заготовки кадрирование задаёт сам вызывающий классом.
   */
  readonly fit?: 'cover' | 'contain';
  /**
   * Форма места, если она задана местом, а не снимком.
   *
   * @remarks
   * Пусто - рамка берёт форму самого снимка. Задана - снимок кадрируется
   * под неё вокруг точки, выбранной владельцем; лента по-прежнему показывает
   * его целиком. Форму выбирает место показа: кубик не знает, где стоит.
   */
  readonly aspect?: FrameAspect | undefined;
}) {
  const frame = mediaFrame(media, aspect);
  if (!frame) return null;
  const doc = media as MediaDoc;
  const { src, srcSet, file, laneSet, blur: placeholder, focus, shape } = frame;
  const text = alt ?? doc.alt ?? '';
  /*
    Пропорция кадра выставлена переменной на том элементе, что получает
    классы места, - на рамке или на самом снимке. Место считает по ней
    ширину, когда кадр упирается в потолок высоты: у рамки своей ширины нет,
    снимок внутри неё лежит поверх, и без пропорции рамка сжалась бы в ноль.
  */
  const ratio: CSSProperties | undefined = shape
    ? ({ '--media-ratio': String(shape.width / shape.height) } as CSSProperties)
    : undefined;
  const pictureStyle: CSSProperties = {
    ...(placeholder ? undefined : ratio),
    ...(!placeholder && aspect
      ? { aspectRatio: `${aspect.width} / ${aspect.height}`, objectFit: 'cover' }
      : undefined),
    ...(focus ? { objectPosition: focus } : undefined),
  };

  const picture = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-part="media-image"
      {...(zoom
        ? {
            'data-zoom': laneSet,
            ...(file ? { 'data-zoom-full': file } : {}),
            // Та же заготовка служит и в ленте, пока крупный кадр идёт по сети.
            ...(placeholder ? { 'data-zoom-blur': placeholder } : {}),
            // Подпись под кадром в ленте: заголовок и пояснение берутся у файла,
            // чтобы лента не ходила за ними в сеть на каждое открытие.
            ...(doc.caption ? { 'data-zoom-title': doc.caption } : {}),
            ...(doc.description ? { 'data-zoom-note': doc.description } : {}),
          }
        : {})}
      src={src}
      /*
        В разметку идёт весь перечень: на обычной сети кадр приходит одним
        запросом, сразу нужного размера. На слабой его сужает помощник страницы -
        он видит соединение, а сервер нет.
      */
      {...(srcSet ? { srcSet, sizes: place } : {})}
      /*
        Место кадра записано рядом: помощник страницы сперва просит мелкую
        ступень, а вернуть настоящую подсказку ему нужно отсюда - сам он
        про колонки и панели не знает.
      */
      {...(srcSet ? { 'data-place': place } : {})}
      alt={text}
      {...(doc.width ? { width: doc.width } : {})}
      {...(doc.height ? { height: doc.height } : {})}
      loading={loading}
      {...(Object.keys(pictureStyle).length ? { style: pictureStyle } : {})}
      {...(fetchPriority ? { fetchPriority } : {})}
      decoding={decoding ?? (placeholder ? 'sync' : 'async')}
      className={cn(
        placeholder
          ? /*
              Внутри рамки кадр заполняет её целиком и кадрируется так же, как
              заготовка под ним: иначе при подмене картинка прыгает - одна
              обрезана по рамке, вторая вписана по-своему.

              Сам кадр не размывается. Размыта только заготовка: кадр из кеша
              готов мгновенно, а снять с него размытие можно лишь кодом, и до
              тех пор готовый снимок висел бы мутным - при каждом обновлении
              страницы.
            */
            cn(
              'absolute inset-0 h-full w-full',
              fit === 'contain' && !aspect ? 'object-contain' : 'object-cover',
            )
          : cn('max-w-full', className),
        zoom && 'cursor-zoom-in',
      )}
    />
  );

  /*
    Кадр, который открывается лентой, лежит внутри ссылки на сам файл. Лента
    перехватывает нажатие и переход отменяет, но до её прихода - а на слабой
    сети скрипт идёт секунды - нажатие всё равно ведёт к снимку, а не пропадает
    впустую. Признак отличает эту ссылку от чужой: чужую лента не трогает,
    у неё своё назначение.
  */
  const opened =
    zoom && file ? (
      <a href={file} data-part="media-image-link" data-zoom-link className="contents">
        {picture}
      </a>
    ) : (
      picture
    );

  if (!placeholder) return opened;

  /*
    Рамка держит место кадра и его форму: пропорции проставлены, края чёткие.
    Размывается содержимое, а не она сама.

    Заготовка лежит своим слоем под снимком и размыта всё время, пока видна:
    это картинка в тридцать точек, без размытия она читалась бы мозаикой.
    Снимок ложится поверх неё непрозрачным и закрывает её собой - поэтому
    перехода «одно сквозь другое» не видно, виден один кадр, наводящийся
    на резкость.
  */
  return (
    <span
      data-part="media-image-frame"
      /*
        Рамка залита нейтральным тоном палитры: пока заготовка не отрисовалась,
        сквозь неё был бы виден фон страницы, и кадр моргал бы с белого в пятно.
        Тон берётся из темы, поэтому в тёмной он тоже уместен.
      */
      className={cn('relative block overflow-hidden bg-surface', className)}
      style={shape ? { aspectRatio: `${shape.width} / ${shape.height}`, ...ratio } : undefined}
    >
      {/*
        Заготовка выходит за края рамки, а не увеличивается: размытие съедает
        края и оставляет по периметру светлую кайму, а рамка лишнее обрезает.
      */}
      <span
        aria-hidden
        data-part="media-image-blur"
        /*
          Заготовка гаснет, когда пришла первая ступень: помощник ставит рамке
          признак готовности. Готовый из кеша кадр снимает её сразу, без хода, -
          иначе размытие мигает на каждом обновлении страницы.
        */
        className={cn(
          'pointer-events-none absolute -inset-4 blur-md',
          'transition-opacity duration-500',
          '[[data-ready]>&]:opacity-0',
          '[[data-ready="now"]>&]:duration-0',
        )}
        style={{
          backgroundImage: `url("${placeholder}")`,
          backgroundSize: aspect ? 'cover' : fit,
          // Заготовка подрезается там же, где снимок: иначе при подмене он прыгает.
          backgroundPosition: focus ?? 'center',
        }}
      />
      {opened}
      {/*
        Надпись о медленной сети: её проявляет помощник страницы, если за
        несколько секунд не пришла ни одна ступень. Без неё человек смотрит
        в размытое пятно и не понимает, грузится оно или сломалось.
      */}
      <span
        data-part="media-image-hint"
        className="pointer-events-none absolute inset-0 flex items-center justify-center bg-media-scrim text-sm text-on-media-soft opacity-0 transition-opacity duration-300 [[data-slow]>&]:opacity-100 [[data-failed]>&]:opacity-100"
      >
        <span className="[[data-failed]_&]:hidden">Медленная сеть, кадр ещё идёт</span>
        <span className="hidden [[data-failed]_&]:inline">Кадр не догрузился</span>
      </span>
    </span>
  );
}
