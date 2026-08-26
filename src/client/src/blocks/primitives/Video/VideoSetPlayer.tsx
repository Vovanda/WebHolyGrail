'use client';

import { useEffect, useState } from 'react';
import type { VideoSetItem } from 'contracts';

import { cn } from '@/lib/utils';

import { AccessCodeDialog } from './AccessCodeDialog';
import { ACCESS_GRANTED_EVENT } from './AccessCodeForm';
import { VideoPlayer } from './VideoPlayer';
import { VideoSetDrawer } from './VideoSetDrawer';
import { VideoSetList } from './VideoSetList';

/**
 * Набор роликов с плеером: слева видео, справа список.
 *
 * @remarks
 * Так набор показывают везде, где его смотрят: зритель переключает ролики
 * и не уходит со страницы. Клиентский по необходимости (R14) — переключение
 * происходит в браузере.
 *
 * Токен зрителя один на сессию и к ролику не привязан, поэтому смена ролика
 * не требует ни нового токена, ни обращения к серверу: конверт с ключом
 * плеер запросит сам для того ролика, который начал играть.
 *
 * Закрытые ролики остаются в списке, но не выбираются: играть им нечем,
 * а ссылка ведёт на их страницу, где написано, как получить доступ.
 */
export interface VideoSetPlayerProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  readonly token: string;
  readonly channel: string | null;
  readonly setCode: string | null;
  readonly className?: string;
}

export function VideoSetPlayer({
  items: initial,
  token,
  channel,
  setCode,
  className,
}: VideoSetPlayerProps) {
  /**
   * Список держим в состоянии: после введённого кода замки снимаются здесь же.
   *
   * Адрес потока у закрытых роликов уже есть — он не секрет и приходит вместе
   * со списком, — поэтому достаточно снять признак, и ролик играет: ключ
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

  // Начинаем с первого, который вообще может играть: если открыт только третий
  // ролик, показывать заглушку вместо него незачем.
  const [current, setCurrent] = useState<VideoSetItem | null>(
    () => items.find((item) => !item.locked && item.ready && item.playlistUrl) ?? null,
  );

  /*
    Вид списка переключается на месте: рядом с плеером или боковой панелью,
    которая сдвигает страницу. На узком экране колонка рядом не помещается,
    и панель оказывается единственным способом добраться до набора, не
    прокручивая всё видео.
  */
  const [asPanel, setAsPanel] = useState(false);

  /*
    Соседи текущего видео среди тех, что вообще могут играть. Закрытые и ещё
    не нарезанные пропускаем: стрелка, ведущая на замок, обрывает просмотр.
  */
  const playable = items.filter((item) => !item.locked && item.ready && item.playlistUrl);
  const at = current ? playable.findIndex((item) => item.id === current.id) : -1;
  const prev = at > 0 ? playable[at - 1] : undefined;
  const next = at >= 0 && at < playable.length - 1 ? playable[at + 1] : undefined;

  return (
    <div
      className={cn(
        'grid gap-5 pb-6',
        asPanel ? 'grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_20rem]',
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {asPanel && (
            <VideoSetDrawer
              items={items}
              channel={channel}
              setCode={setCode}
              currentCode={current?.code ?? null}
              onSelect={setCurrent}
            />
          )}
          <button
            type="button"
            onClick={() => setAsPanel((value) => !value)}
            className="ml-auto rounded-lg border border-border bg-paper px-3 py-2 text-sm text-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            {asPanel ? 'Список рядом' : 'Список панелью'}
          </button>
        </div>
        {current?.playlistUrl ? (
          <>
            <VideoPlayer
              key={String(current.id)}
              src={current.playlistUrl}
              token={token}
              mediaId={current.id}
              poster={current.poster ?? undefined}
              title={current.title}
              onPrev={prev ? () => setCurrent(prev) : undefined}
              onNext={next ? () => setCurrent(next) : undefined}
            />
            <h3 className="text-body font-medium text-ink text-balance">{current.title}</h3>
          </>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-surface px-6 text-center">
            <p className="text-body text-muted">
              В наборе нет видео, доступного к показу прямо сейчас.
            </p>
          </div>
        )}
      </div>

      {/*
        Список ограничен высотой плеера и прокручивается: иначе длинный набор
        растягивает страницу, и до того, что под ним, никто не доходит.
      */}
      {!asPanel && (
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

      {/* Нажатие на закрытый ролик открывает это окно — замок не должен быть тупиком. */}
      <AccessCodeDialog token={token} />
    </div>
  );
}
