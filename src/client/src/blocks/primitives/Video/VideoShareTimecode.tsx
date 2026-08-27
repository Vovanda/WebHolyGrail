'use client';

import { CopyLinkButton } from '@/blocks/primitives/CopyLinkButton';

import { timecodeHref } from './useVideoTimecode';

/**
 * Поделиться записью с текущего места.
 *
 * @remarks
 * Так пересылают куски записей: «смотри с 3:20». Без этого человек отправляет
 * ссылку и объясняет словами, куда мотать.
 *
 * Кадр находим на самой странице, а не пробрасываем сверху: плеер собирается
 * в браузере, и на сервере ссылки на него всё равно нет. Видео на странице
 * одно, поэтому поиск однозначен.
 */
export function VideoShareTimecode({
  label = 'Ссылка с этого места',
}: {
  readonly label?: string;
}) {
  return (
    <CopyLinkButton
      label={label}
      href={() => {
        const video = document.querySelector('video');
        // Видео ещё не готово - отдаём обычную ссылку: пустая позиция в адресе
        // хуже её отсутствия.
        if (!video || !Number.isFinite(video.currentTime)) return window.location.href;
        return timecodeHref(video.currentTime);
      }}
    />
  );
}
