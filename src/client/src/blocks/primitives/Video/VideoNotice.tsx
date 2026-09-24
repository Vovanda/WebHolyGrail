import type { MediaRef } from 'contracts';

import { MediaImage } from '@/blocks/primitives/Media';
import { cn } from '@/lib/utils';

/**
 * Рамка на месте плеера, когда запись не играет.
 *
 * @remarks
 * С кадром записи и словами, а не чёрным прямоугольником: зритель должен
 * понимать, что запись есть и почему она не играет, иначе страница выглядит
 * сломанной.
 *
 * Рамка держит форму записи 16:9 сама, а кадр лежит в ней слоем: кадр, который
 * не пришёл - выключенное хранилище, медленная сеть, - иначе схлопывал рамку
 * в полоску с надписью. Надпись с действием идёт потоком: на телефоне им
 * бывает тесно в 16:9, и тогда рамка вытягивается, а не обрезает ошибку кода.
 *
 * Что делать зрителю, рамка не знает: действие приходит от того, кто её ставит.
 * Закрытой записи и блок видео, и плейлист кладут форму кода, а записи, которая
 * готовится, класть нечего.
 */
export function VideoNotice({
  poster,
  place = '(max-width: 768px) 100vw, 1200px',
  text,
  children,
}: {
  /** Кадр записи. Номер без документа рисовать нечем - рамка остаётся пустой. */
  readonly poster?: MediaRef | null;
  /** Сколько места занимает рамка: по нему берётся ступень кадра. */
  readonly place?: string;
  readonly text: string;
  /** Что зритель может сделать: форма кода и подобное. */
  readonly children?: React.ReactNode;
}) {
  const shown = typeof poster === 'object' && poster !== null;
  return (
    <div
      data-part="notice"
      /*
        Без overflow-hidden: у рамки с обрезкой пропорция держит высоту жёстко,
        и тесное содержимое уходило бы за край. Скругление кадр и затемнение
        наследуют сами.
      */
      className="relative grid aspect-video rounded-xl border border-border bg-surface"
    >
      {shown && (
        <MediaImage
          media={poster}
          place={place}
          alt=""
          zoom={false}
          /*
            Не загрузившийся кадр браузер рисует значком битого файла, и тот
            просвечивает сквозь затемнение. Подложка до картинки видна только
            у битого кадра: у загруженного псевдоэлемента нет.
          */
          className="absolute inset-0 h-full w-full rounded-[inherit] object-cover before:absolute before:inset-0 before:bg-surface before:content-['']"
        />
      )}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-4 rounded-[inherit] px-6 py-5 text-center',
          shown ? 'bg-black/60 text-white' : 'text-ink',
        )}
      >
        <p data-part="caption" className="text-body font-medium">
          {text}
        </p>
        {children && (
          /*
            Действие на подложке: поле и красная строка ошибки на затемнённом
            кадре читаются плохо, а подложка держит их при любом кадре.
          */
          <div
            data-part="action"
            className="w-full max-w-sm rounded-lg bg-paper p-3 text-left text-ink"
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
