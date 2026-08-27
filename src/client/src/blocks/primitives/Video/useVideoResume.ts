'use client';

import { useEffect } from 'react';

/**
 * Продолжить с места остановки.
 *
 * @remarks
 * Длинную запись редко смотрят за раз, а искать место руками мучительно.
 * Позиция запоминается по ходу просмотра и восстанавливается при возврате.
 *
 * Место хранится у зрителя в браузере: это его личное удобство, и на сервере
 * ему делать нечего.
 *
 * Начало и конец не запоминаем. В начале возвращать некуда, а досмотренную
 * запись человек открывает заново - вернуть его на последние секунды значит
 * показать титры вместо видео.
 */
export interface VideoResumeOptions {
  /** Ключ записи: у каждой своя память. */
  readonly mediaId: string | number;
  /** С какой секунды считаем, что смотреть уже начали. */
  readonly startAfter?: number;
  /** За сколько секунд до конца перестаём запоминать. */
  readonly stopBefore?: number;
}

/** Как часто сохранять место: чаще - лишние записи, реже - потеря минуты. */
const SAVE_EVERY_MS = 5000;

/**
 * Стоит ли возвращать зрителя к сохранённому месту.
 *
 * @remarks
 * Вынесено отдельно, потому что здесь и живут все решения: остальное в хуке -
 * подписка на события. Ошибка тут стоит дорого - человек попадает на титры
 * вместо начала или теряет место, до которого досмотрел.
 */
export function shouldResume({
  saved,
  duration,
  stopBefore,
  hasTimecode,
}: {
  /** Сохранённое место, если оно есть. */
  readonly saved: number | null;
  readonly duration: number;
  /** За сколько секунд до конца перестаём считать место осмысленным. */
  readonly stopBefore: number;
  /** В адресе указано конкретное место. */
  readonly hasTimecode: boolean;
}): boolean {
  // Таймкод в адресе главнее памяти: человек открыл ссылку на конкретное место.
  if (hasTimecode) return false;
  if (saved === null || saved <= 0) return false;
  if (!duration) return false;
  // Досмотренную запись открывают заново: вернуть на титры хуже, чем ничего.
  // Граница строгая: когда до конца остаётся ровно отведённый запас, запись
  // уже досмотрена.
  return saved < duration - stopBefore;
}

export function useVideoResume(
  media: HTMLVideoElement | null,
  { mediaId, startAfter = 15, stopBefore = 20 }: VideoResumeOptions,
): void {
  useEffect(() => {
    if (!media) return;

    const key = `whg:resume:${mediaId}`;

    // Возврат к месту - один раз, когда известна длительность. Дальше зритель
    // управляет сам, и подменять ему позицию нельзя.
    let restored = false;
    const restore = () => {
      if (restored || !media.duration) return;
      restored = true;
      const saved = read(key);
      const hasTimecode = new URLSearchParams(window.location.search).has('t');
      if (!shouldResume({ saved, duration: media.duration, stopBefore, hasTimecode })) return;
      media.currentTime = saved as number;
    };

    let lastSave = 0;
    const remember = () => {
      const now = Date.now();
      if (now - lastSave < SAVE_EVERY_MS) return;
      lastSave = now;
      const at = media.currentTime;
      if (at < startAfter) return;
      if (media.duration && at > media.duration - stopBefore) {
        forget(key);
        return;
      }
      write(key, at);
    };

    const finish = () => forget(key);

    media.addEventListener('loadedmetadata', restore);
    media.addEventListener('durationchange', restore);
    media.addEventListener('timeupdate', remember);
    media.addEventListener('ended', finish);
    restore();

    return () => {
      media.removeEventListener('loadedmetadata', restore);
      media.removeEventListener('durationchange', restore);
      media.removeEventListener('timeupdate', remember);
      media.removeEventListener('ended', finish);
    };
  }, [media, mediaId, startAfter, stopBefore]);
}

function read(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    // Хранилище бывает закрыто настройками браузера: просмотр от этого не ломается.
    return null;
  }
}

function write(key: string, seconds: number): void {
  try {
    window.localStorage.setItem(key, String(Math.floor(seconds)));
  } catch {
    // см. выше
  }
}

function forget(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // см. выше
  }
}
