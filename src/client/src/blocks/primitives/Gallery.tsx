import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { AspectRows } from '@/blocks/arrangements/AspectRows';
import { CarouselDeck, CarouselItem } from '@/blocks/arrangements/Carousel/CarouselDeck';
import { MediaImage } from '@/blocks/primitives/Media';
import { galleryFrames, isRecording, type GalleryFrame } from '@/lib/gallery';
import { singleFrameAspect, type FrameAspect } from '@/lib/media';

/**
 * Галерея: набор снимков одним из трёх видов.
 *
 * @remarks
 * Рисуется на сервере (R14): своего состояния у галереи нет, а листание
 * и открытие крупно живут в примитивах.
 *
 * Своей вёрстки здесь нет вовсе - блок выбирает готовую раскладку и отдаёт ей
 * набор. Переключатель живёт в блоке, а не внутри раскладки: у компонента поле
 * вида запрещено, такое уже убирали у сетки фич.
 *
 * Открытие крупно подключать не нужно: кадр рисует кубик, а он помечает себя
 * сам, и лента страницы подхватывает его вместе со всеми остальными.
 */
export interface GalleryData {
  readonly heading?: string;
  /** Кадры набора: снимки и записи медиатеки в порядке показа. */
  readonly files?: readonly (MediaRef | null | undefined)[];
  readonly view?: 'tiles' | 'carousel' | 'list';
}

/** Место кадра в вёрстке: по нему браузер выбирает вариант нужного размера. */
const PLACE = {
  tiles: '(max-width: 768px) 50vw, 420px',
  carousel: '(max-width: 768px) 100vw, 832px',
  list: '(max-width: 768px) 100vw, 832px',
} as const;

function shapeOf(frame: GalleryFrame) {
  return { width: frame.file.width, height: frame.file.height };
}

export function Gallery({
  node,
}: {
  readonly node: BlockNode & { data?: GalleryData };
  readonly settings?: SiteSettings;
}) {
  const data = node.data ?? {};
  const items = galleryFrames(data.files);
  if (items.length === 0) return null;

  const view = data.view ?? 'tiles';

  /*
    Запись стоит в галерее наравне со снимком: съёмка с объекта идёт вперемешку
    с фотографиями, и разносить их по разным блокам незачем. Показывается она
    своим кадром из видео и меткой поверх - по ней видно, что это запись,
    а не снимок.
  */
  const still = (item: GalleryFrame, place: string, className?: string, aspect?: FrameAspect) => {
    const doc = item.file;
    const shot = doc.preview && typeof doc.preview === 'object' ? doc.preview : null;
    return (
      <span className="relative block h-full">
        {/*
          Кадр записи показывается тем же кубиком, что и снимок: он такой же
          файл медиатеки со своими ступенями. Документ приходит рядом с записью,
          и только когда его нет - показ остаётся на адресе кадра.
        */}
        {shot ? (
          <MediaImage
            media={shot}
            place={place}
            aspect={aspect}
            className={className ?? 'w-full'}
            alt={item.caption ?? doc.alt ?? ''}
            zoom={false}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={doc.previewUrl ?? ''}
            alt={item.caption ?? doc.alt ?? ''}
            loading="lazy"
            className={className ?? 'w-full'}
          />
        )}
        <span
          data-part="gallery-recording"
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <span className="rounded-full bg-black/45 px-4 py-2 text-sm text-white backdrop-blur">
            Запись
          </span>
        </span>
      </span>
    );
  };

  /*
    Одиночный кадр ряда: снимок или запись, подпись под ним. Форма места
    задаётся только там, где кадр стоит один в строке, - в виде «подряд».
  */
  const frame = (item: GalleryFrame, place: string, className?: string, aspect?: FrameAspect) => (
    <figure className="m-0">
      {isRecording(item) ? (
        still(item, place, className, aspect)
      ) : (
        <MediaImage
          media={item.file}
          place={place}
          fit="contain"
          aspect={aspect}
          {...(className ? { className } : {})}
          {...(item.caption ? { alt: item.caption } : {})}
        />
      )}
      {item.caption && (
        <figcaption data-part="gallery-caption" className="mt-2 text-sm text-muted">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );

  return (
    <section data-part="gallery">
      {data.heading && <h2 className="mb-4 text-2xl font-semibold">{data.heading}</h2>}

      {/*
        В плитке подпись лежит поверх кадра у нижнего края: ячейка держит форму
        и обрезает всё лишнее, поэтому под кадром для текста места нет.
      */}
      {view === 'tiles' && (
        <AspectRows items={items} shapeOf={shapeOf}>
          {(item) => (
            <figure className="relative m-0 h-full">
              {isRecording(item) ? (
                still(item, PLACE.tiles)
              ) : (
                <MediaImage
                  media={item.file}
                  place={PLACE.tiles}
                  /* В плитке кадр заполняет ячейку: её форма уже приведена
                     к близкой, поэтому подрезка мелкая, а ряд остаётся ровным.
                     Целиком снимок показывает лента - там он как снят. */
                  className="h-full w-full"
                  {...(item.caption ? { alt: item.caption } : {})}
                />
              )}
              {item.caption && (
                <figcaption
                  data-part="gallery-caption"
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-sm text-white"
                >
                  {item.caption}
                </figcaption>
              )}
            </figure>
          )}
        </AspectRows>
      )}

      {/*
        Каруселью кадры идут по одному и на всю ширину места: иначе снимок
        занимает треть экрана, а две трети пустуют.
      */}
      {view === 'carousel' && (
        <CarouselDeck arrows dots gap="md" aspect="16 / 9">
          {items.map((item, index) => (
            <CarouselItem key={index}>
              {frame(item, PLACE.carousel, 'h-full w-full object-contain')}
            </CarouselItem>
          ))}
        </CarouselDeck>
      )}

      {/*
        Подряд кадры идут один под другим и по центру, с пределом высоты:
        вертикальный снимок иначе занимает три экрана, и до следующего человек
        не доходит.
      */}
      {view === 'list' && (
        <div className="flex flex-col items-center gap-6">
          {items.map((item, index) => (
            // Кадр один в строке и стоит по центру - подпись под ним тоже.
            <div key={index} className="w-full max-w-[52rem] [&_figcaption]:text-center">
              {frame(item, PLACE.list, 'media-single rounded-lg', singleFrameAspect(item.file))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
