'use client';

import { useEffect, useState } from 'react';
import type { VideoSetItem } from 'contracts';

import { ACCESS_GRANTED_EVENT } from './AccessCodeForm';

/**
 * Список плейлиста, у которого замки снимаются после введённого кода.
 *
 * @remarks
 * Адрес потока у закрытых видео уже есть - он не секрет и приходит вместе со
 * списком, - поэтому достаточно снять признак, и видео играет: ключ сервер
 * выдаст, право лежит в токене. Перезагружать страницу незачем, она сбросила
 * бы позицию и моргнула.
 *
 * Сначала проигрываем снятие замка и только потом убираем его из списка: если
 * снять сразу, иконка исчезнет мгновенно и человек не поймёт, что изменилось.
 *
 * Списков на странице бывает несколько - рядом с плеером и в боковой панели, -
 * и каждый слушает событие сам. Общего состояния между ними нет намеренно:
 * событие приходит всем сразу, а лишняя связь между блоками стоила бы дороже.
 */

/** Сколько длится снятие замка. Столько же живёт подсветка в разметке. */
const UNLOCK_MS = 700;

export function useUnlockableItems(initial: ReadonlyArray<VideoSetItem>): {
  readonly items: ReadonlyArray<VideoSetItem>;
  /** Идёт ли сейчас снятие замков: по нему список подсвечивает открывшееся. */
  readonly unlocking: boolean;
} {
  const [items, setItems] = useState(initial);
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    function onGranted() {
      setUnlocking(true);
      setTimeout(() => {
        setItems((current) => current.map((item) => ({ ...item, locked: false })));
        setUnlocking(false);
      }, UNLOCK_MS);
    }

    window.addEventListener(ACCESS_GRANTED_EVENT, onGranted);
    return () => window.removeEventListener(ACCESS_GRANTED_EVENT, onGranted);
  }, []);

  return { items, unlocking };
}
