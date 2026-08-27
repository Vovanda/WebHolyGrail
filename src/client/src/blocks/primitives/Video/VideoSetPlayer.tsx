'use client';

import { useEffect, useRef, useState } from 'react';
import type { VideoSetItem, VideoDeniedSettings } from 'contracts';

import { cn } from '@/lib/utils';

import { AccessCodeDialog } from './AccessCodeDialog';
import { ACCESS_GRANTED_EVENT } from './AccessCodeForm';
import { VideoPlayer } from './VideoPlayer';
import { VideoSetDrawer } from './VideoSetDrawer';
import { VideoUpNext } from './VideoUpNext';

/** Как показать плейлист рядом с плеером. */
type SetView = 'column' | 'row' | 'panel';

const VIEWS: ReadonlyArray<{ value: SetView; label: string }> = [
  { value: 'column', label: 'Списком' },
  { value: 'row', label: 'Лентой' },
  { value: 'panel', label: 'Панелью' },
];
import { VideoSetList } from './VideoSetList';
import { neighboursOf } from './selected-video';
import { useSelectedVideo } from './useSelectedVideo';

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
  /** Название плейлиста: с ним панель подписана по делу, а не словом «Плейлист». */
  readonly title?: string | undefined;
  /** Какой слой управления рисовать: приходит из настроек сайта. */
  readonly playerUi?: 'vidstack' | 'chrome' | undefined;
  /** Что показать вместо закрытой записи: приходит из настроек сайта. */
  readonly deniedSettings?: VideoDeniedSettings | undefined;
  readonly className?: string;
}

export function VideoSetPlayer({
  items: initial,
  token,
  channel,
  setCode,
  title,
  playerUi,
  deniedSettings,
  className,
}: VideoSetPlayerProps) {
  /**
   * Список держим в состоянии: после введённого кода замки снимаются здесь же.
   *
   * Адрес потока у закрытых видео уже есть — он не секрет и приходит вместе
   * со списком, — поэтому достаточно снять признак, и видео играет: ключ
   * сервер выдаст, право лежит в токене. Перезагружать страницу незачем,
   * она сбросила бы позицию и моргнула.
   */
  const [items, setItems] = useState(initial);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    function onGranted() {
      // Сначала проигрываем снятие замка, и только потом убираем его из
      // состояния: если снять сразу, иконка исчезнет мгновенно и человек
      // не поймёт, что именно изменилось.
      setUnlocking(true);
      setTimeout(() => {
        setItems((current) => current.map((item) => ({ ...item, locked: false })));
        setUnlocking(false);
      }, 700);
    }

    window.addEventListener(ACCESS_GRANTED_EVENT, onGranted);
    return () => window.removeEventListener(ACCESS_GRANTED_EVENT, onGranted);
  }, []);

  /*
    Выбранное видео живёт в адресе, а не здесь: так ссылка на нужное видео
    работает сама собой, «назад» возвращает к предыдущему, а список может
    стоять хоть в боковой панели, которую собирает лейаут.
  */
  const { current, select: setCurrent } = useSelectedVideo(items);

  /*
    Вид списка переключается на месте: рядом с плеером или боковой панелью,
    которая сдвигает страницу. На узком экране колонка рядом не помещается,
    и панель оказывается единственным способом добраться до плейлиста, не
    прокручивая всё видео.
  */
  /*
    Выбранный вид запоминается: человек, переключившийся на панель, ждёт её и
    на следующей записи. Выбор личный и живёт в браузере зрителя.
  */
  const [view, setViewState] = useState<SetView>('column');

  useEffect(() => {
    const saved = readView();
    if (saved) setViewState(saved);
  }, []);

  const setView = (next: SetView) => {
    setViewState(next);
    rememberView(next);
  };
  // Кадр нужен карточке «дальше»: она следит за окончанием видео.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const asPanel = view === 'panel';

  /*
    Соседи текущего видео среди тех, что вообще могут играть. Закрытые и ещё
    не нарезанные пропускаем: стрелка, ведущая на замок, обрывает просмотр.
  */
  const { prev, next } = neighboursOf(items, current);

  return (
    <div
      className={cn(
        'grid gap-5 pb-6',
        view === 'column' ? 'lg:grid-cols-[minmax(0,1fr)_20rem]' : 'grid-cols-1',
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {/* Слева выбор вида, справа кнопка панели - там же, откуда панель выезжает. */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-border bg-paper p-1">
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

          {asPanel && (
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
        {current?.playlistUrl ? (
          <>
            <VideoPlayer
              key={String(current.id)}
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
            <h3 className="text-body font-medium text-ink text-balance">{current.title}</h3>
          </>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-surface px-6 text-center">
            <p className="text-body text-muted">
              В плейлисте нет видео, доступного к показу прямо сейчас.
            </p>
          </div>
        )}
      </div>

      {/*
        Список ограничен высотой плеера и прокручивается: иначе длинный плейлист
        растягивает страницу, и до того, что под ним, никто не доходит.
      */}
      {view === 'row' && (
        <VideoSetList
          items={items}
          channel={channel}
          setCode={setCode}
          currentCode={current?.code ?? null}
          orientation="horizontal"
          onSelect={setCurrent}
          unlocking={unlocking}
        />
      )}

      {view === 'column' && (
        <VideoSetList
          items={items}
          channel={channel}
          setCode={setCode}
          currentCode={current?.code ?? null}
          onSelect={setCurrent}
          unlocking={unlocking}
          className="max-h-[32rem] overflow-y-auto pr-1 [scrollbar-width:thin]"
        />
      )}

      {/* Нажатие на закрытый видео открывает это окно — замок не должен быть тупиком. */}
      <AccessCodeDialog token={token} />
    </div>
  );
}

/** Ключ памяти: у каждого зрителя свой выбор вида. */
const VIEW_KEY = 'whg:set-view';

function readView(): SetView | null {
  try {
    const raw = window.localStorage.getItem(VIEW_KEY);
    return raw === 'column' || raw === 'row' || raw === 'panel' ? raw : null;
  } catch {
    // Хранилище бывает закрыто настройками браузера: плейлист от этого работает
    // как обычно, просто без памяти о выборе.
    return null;
  }
}

function rememberView(view: SetView): void {
  try {
    window.localStorage.setItem(VIEW_KEY, view);
  } catch {
    // см. выше
  }
}
