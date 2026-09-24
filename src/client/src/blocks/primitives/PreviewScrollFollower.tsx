'use client';

import { readPreviewScroll, scrollTopFor } from 'contracts';
import { useEffect } from 'react';

import { CMS_URL } from '@/lib/cms-url';

/**
 * Страница в панели предпросмотра встаёт на ту же долю, что форма рядом.
 *
 * @remarks
 * Админка шлёт долю прокрутки формы сообщением. Слушатель работает только
 * внутри рамки и принимает весть только от адреса CMS: обычному посетителю
 * он ничего не делает, а чужая страница прокрутить сайт не может.
 */
export function PreviewScrollFollower() {
  useEffect(() => {
    if (window.parent === window) return;
    const cms = new URL(CMS_URL).origin;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== cms) return;
      const ratio = readPreviewScroll(event.data);
      if (ratio === null) return;
      const page = document.scrollingElement ?? document.documentElement;
      window.scrollTo({ top: scrollTopFor(ratio, page.scrollHeight, window.innerHeight) });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return null;
}
