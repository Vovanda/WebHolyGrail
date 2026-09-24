'use client';

import { previewScrollMessage, scrollRatio } from 'contracts';
import { useEffect, type ReactNode } from 'react';

/** Рамка предпросмотра, как её размечает Payload. */
const PREVIEW_FRAME = '.live-preview-window iframe';

function previewFrame(): HTMLIFrameElement | null {
  return document.querySelector<HTMLIFrameElement>(PREVIEW_FRAME);
}

/** Шлёт в рамку долю прокрутки формы; рамки нет - ничего не делает. */
function sendRatio(): void {
  const frame = previewFrame();
  if (!frame?.contentWindow || !frame.src) return;
  const page = document.scrollingElement ?? document.documentElement;
  const ratio = scrollRatio(page.scrollTop, page.scrollHeight, page.clientHeight);
  frame.contentWindow.postMessage(previewScrollMessage(ratio), new URL(frame.src).origin);
}

/**
 * Страница в панели предпросмотра идёт за прокруткой формы.
 *
 * @remarks
 * Стоит провайдером на всю админку: панель есть не у одной коллекции, а слушать
 * нужно прокрутку самой страницы админки. Где панели нет, он молчит. Доля
 * уходит не чаще раза за кадр отрисовки, и ещё раз - когда рамка загрузила
 * страницу заново: иначе после перезагрузки она стояла бы в начале.
 *
 * Сообщение адресовано ровно адресу рамки: чужой странице оно не уйдёт.
 */
export function PreviewScrollSync({ children }: { readonly children?: ReactNode }) {
  useEffect(() => {
    let pending = 0;
    const onScroll = () => {
      if (pending) return;
      pending = window.requestAnimationFrame(() => {
        pending = 0;
        sendRatio();
      });
    };
    // Рамка грузит страницу и после сохранения, и после смены адреса.
    const onLoad = (event: Event) => {
      if (event.target instanceof HTMLIFrameElement && event.target.matches(PREVIEW_FRAME)) {
        sendRatio();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('load', onLoad, true);
    return () => {
      window.cancelAnimationFrame(pending);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('load', onLoad, true);
    };
  }, []);

  return <>{children}</>;
}
