'use client';

import { useEffect, useRef, useState } from 'react';
import type { VideoSetItem, VideoDeniedSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { AccessCodeDialog } from './AccessCodeDialog';
import { VideoPlayer } from './VideoPlayer';
import { VideoSetDrawer } from './VideoSetDrawer';
import { VideoSetList } from './VideoSetList';
import { VideoUpNext } from './VideoUpNext';
import { neighboursOf } from './selected-video';
import { useSelectedVideo } from './useSelectedVideo';
import { useUnlockableItems } from './useUnlockableItems';

/**
 * Как показать список плейлиста.
 *
 * @remarks
 * Виды взаимоисключающие: колонка стоит рядом с плеером, лента лежит под ним,
 * панель прячет список за кнопкой в углу и выезжает по нажатию. При панели
 * ничего под плеером не рисуется - в этом и смысл, освободить место.
 *
 * Выбирает владелец в настройках блока. Зритель ничего не переключает: на
 * обычном сайте вид один и задан заранее.
 */
export type SetView = 'column' | 'row' | 'panel';

const VIEWS: ReadonlyArray<{ value: SetView; label: string }> = [
  { value: 'column', label: 'Списком' },
  { value: 'row', label: 'Лентой' },
  { value: 'panel', label: 'Панелью' },
];

/**
 * Плейлист видео с плеером: слева видео, справа список.
 *
 * @remarks
 * Так плейлист показывают везде, где его смотрят: зритель переключает видео
 * и не уходит со страницы. Клиентский по необходимости (R14) — переключение
 * происходит в браузере.
 *
 * Токен зрителя один на сессию и к видео не привязан, поэтому смена видео
 * не требует ни нового токена, ни обращения к серверу: конверт с ключом
 * плеер запросит сам для того видео, который начал играть.
 *
 * Закрытые видео остаются в списке, но не выбираются: играть им нечем,
 * а ссылка ведёт на их страницу, где написано, как получить доступ.
 */
export interface VideoSetPlayerProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  readonly token: string;
  readonly channel: string | null;
  readonly setCode: string | null;
  /** Какой слой управления рисовать: приходит из настроек сайта. */
  readonly playerUi?: 'vidstack' | 'chrome' | undefined;
  /** Что показать вместо закрытой записи: приходит из настроек сайта. */
  readonly deniedSettings?: VideoDeniedSettings | undefined;
  /** Как показывать список: задаётся в настройках блока. */
  readonly view?: SetView | undefined;
  /**
   * Сколько карточек видно сразу.
   *
   * @remarks
   * Это не потолок списка: остальные достаются прокруткой, а в ленте свайпом.
   * Число задаёт владелец в поле блока.
   */
  readonly visible?: number | undefined;
  /**
   * Дать зрителю переключать вид.
   *
   * @remarks
   * Нужно витрине шаблона: там переключатель показывает посетителю, что вид
   * настраивается, и заменяет ему поход в админку. На обычном сайте владелец
   * выбрал вид заранее, и переключать его посетителю незачем.
   */
  readonly showViewSwitch?: boolean | undefined;
  /** Название плейлиста: с ним панель подписана по делу, а не словом «Плейлист». */
  readonly title?: string | undefined;
  readonly className?: string;
}

export function VideoSetPlayer({
  view: asked,
  showViewSwitch = false,
  title,
  items: initial,
  token,
  channel,
  setCode,
  playerUi,
  deniedSettings,
  className,
  visible,
}: VideoSetPlayerProps) {
  // Замки снимаются после введённого кода общим хуком: то же самое нужно
  // списку в боковой панели, а два одинаковых слушателя разъезжаются.
  const { items, unlocking } = useUnlockableItems(initial);

  /*
    Выбранное видео живёт в адресе, а не здесь: так ссылка на нужное видео
    работает сама собой, «назад» возвращает к предыдущему, а список может
    стоять хоть в боковой панели, которую собирает лейаут.
  */
  const { current, select: setCurrent } = useSelectedVideo(items);

  /*
    Начальный вид задаёт владелец в настройках блока, а выбор зрителя ложится
    поверх и живёт только у него: человек, переключившийся на панель, ждёт её
    и когда вернётся к этому же плейлисту.

    Память читается после первой отрисовки: на сервере хранилища нет, и вид
    там всегда владельческий.
  */
  const [view, setViewState] = useState<SetView>(asked ?? 'column');

  useEffect(() => {
    const saved = readView(setCode ?? null);
    if (saved) setViewState(saved);
  }, [setCode]);

  const setView = (next: SetView) => {
    setViewState(next);
    rememberView(setCode ?? null, next);
  };
  // Кадр нужен карточке «дальше»: она следит за окончанием видео.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /*
    Соседи текущего видео среди тех, что вообще могут играть. Закрытые и ещё
    не нарезанные пропускаем: стрелка, ведущая на замок, обрывает просмотр.
  */
  const { prev, next } = neighboursOf(items, current);

  return (
    /*
      Кадр и список к нему лежат на одной подложке: без неё список висел
      в воздухе, будто случайно оказался под видео. Панелью список уезжает
      сбоку - подложке там не на чем держаться, и она не нужна.
    */
    <div
      className={cn('flex flex-col gap-3', view === 'panel' ? 'pb-6' : 'media-shell', className)}
    >
      {/*
          Слева выбор вида - только на витрине шаблона. Справа кнопка панели:
          она стоит над плеером, там же, откуда панель выезжает, и подписана
          номером текущего видео.
        */}
      {(showViewSwitch || view === 'panel') && (
        <div className="flex flex-wrap items-center gap-2">
          {showViewSwitch && (
            <div
              data-part="viewswitch"
              className="flex rounded-lg border border-border bg-paper p-1"
            >
              {VIEWS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setView(option.value)}
                  aria-pressed={view === option.value}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    view === option.value
                      ? 'bg-surface font-medium text-ink'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {view === 'panel' && (
            <div className="ml-auto">
              <VideoSetDrawer
                items={items}
                channel={channel}
                setCode={setCode}
                currentCode={current?.code ?? null}
                title={title}
                onSelect={setCurrent}
              />
            </div>
          )}
        </div>
      )}
      {/*
          В ряду только видео и колонка списка: подпись и переключатель стоят
          снаружи. Иначе колонка равнялась бы по всей левой ячейке, а не
          по самому видео - владелец просил именно по видео.
        */}
      <div
        className={cn(
          'grid gap-5',
          view === 'column' ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : 'grid-cols-1',
        )}
      >
        {current?.playlistUrl ? (
          <>
            {/*
              Плеер живёт один на весь просмотр: при переходе к следующему видео
              меняется только источник. Пересоздание рвало ползунки библиотеки -
              она роняла ошибки в консоль на каждой смене.
            */}
            <VideoPlayer
              ui={playerUi}
              deniedSettings={deniedSettings}
              src={current.playlistUrl}
              token={token}
              mediaId={current.id}
              poster={current.poster ?? undefined}
              title={current.title}
              onPrev={prev ? () => setCurrent(prev) : undefined}
              onNext={next ? () => setCurrent(next) : undefined}
              onVideoRef={(video) => {
                videoRef.current = video;
              }}
              overlay={
                next ? (
                  <VideoUpNext item={next} videoRef={videoRef} onSelect={setCurrent} />
                ) : undefined
              }
            />
          </>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-surface px-6 text-center">
            <p className="text-body text-muted">
              В плейлисте нет видео, доступного к показу прямо сейчас.
            </p>
          </div>
        )}

        {view === 'column' && (
          /*
            Колонка равняется по самому видео: она соседняя ячейка того же ряда,
            а карточки внутри прокручиваются.

            Числом «сколько видно» колонка не ограничивается: место здесь задаёт
            высота видео, и обрезка по числу оставляла бы внизу пустоту при
            непоказанных карточках.
          */
          <div className="relative min-h-0">
            <VideoSetList
              items={items}
              channel={channel}
              setCode={setCode}
              currentCode={current?.code ?? null}
              onSelect={setCurrent}
              unlocking={unlocking}
              className="max-h-[32rem] overflow-y-auto pr-1 [scrollbar-width:thin] lg:absolute lg:inset-0 lg:max-h-none"
            />
          </div>
        )}
      </div>

      {/* Подпись под видео - вне ряда, чтобы не растягивать колонку. */}
      {current?.playlistUrl && (
        <h3 data-part="caption" className="text-body font-medium text-ink text-balance">
          {current.title}
        </h3>
      )}

      {/* Лентой список идёт под видео и равняется по его ширине. */}
      {view === 'row' && (
        <VideoSetList
          items={items}
          channel={channel}
          setCode={setCode}
          currentCode={current?.code ?? null}
          orientation="horizontal"
          onSelect={setCurrent}
          unlocking={unlocking}
          limit={visible}
        />
      )}

      {/* Нажатие на закрытый видео открывает это окно — замок не должен быть тупиком. */}
      <AccessCodeDialog token={token} />
    </div>
  );
}

/**
 * Ключ памяти о выбранном виде - на каждый плейлист свой.
 *
 * @remarks
 * Человек привыкает смотреть конкретный курс лентой, а другой - колонкой,
 * и на любой странице того же плейлиста ждёт того же вида. Общий ключ на весь
 * сайт переносил бы выбор туда, где он не к месту.
 *
 * Без кода плейлиста память общая: другого признака у списка нет.
 */
function viewKey(setCode: string | null): string {
  return setCode ? `whg:set-view:${setCode}` : 'whg:set-view';
}

function readView(setCode: string | null): SetView | null {
  try {
    const raw = window.localStorage.getItem(viewKey(setCode));
    return raw === 'column' || raw === 'row' || raw === 'panel' ? raw : null;
  } catch {
    // Хранилище бывает закрыто настройками браузера: плейлист от этого работает
    // как обычно, просто без памяти о выборе.
    return null;
  }
}

function rememberView(setCode: string | null, view: SetView): void {
  try {
    window.localStorage.setItem(viewKey(setCode), view);
  } catch {
    // см. выше
  }
}
