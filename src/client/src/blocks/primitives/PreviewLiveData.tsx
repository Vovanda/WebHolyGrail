'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { CMS_URL } from '@/lib/cms-url';
import { createLatestSender } from '@/lib/latest-sender';

/** Как часто страница в панели показывает правку, мс. */
const EVERY_MS = 1000;

/**
 * Правка из формы - на страницу в панели предпросмотра, до сохранения.
 *
 * @remarks
 * Панель присылает содержимое формы на каждое изменение. Слушатель передаёт
 * его маршруту сайта, тот разворачивает правку в CMS без записи, и страница
 * перечитывается - уже с правкой. Не чаще раза в секунду и по одному запросу:
 * на медленной сети очередь из устаревших правок только тормозила бы показ.
 *
 * Если разворот не удался, страница остаётся как была - на последней удачной
 * правке или на сохранённом. Сохранение по-прежнему обновляет страницу своим
 * путём (`RefreshOnSave`).
 *
 * Весть принимается только от CMS: чужое окно подсунуть правку не может.
 * Обычному посетителю слушатель ничего не делает - вестей ему никто не шлёт.
 */
export function PreviewLiveData() {
  const router = useRouter();

  useEffect(() => {
    const sender = createLatestSender<{ collection: string; data: unknown; locale?: string }>({
      interval: EVERY_MS,
      send: async (draft) => {
        const response = await fetch('/internal/preview/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        });
        if (response.ok) router.refresh();
      },
    });

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== CMS_URL) return;
      const message = event.data as {
        type?: unknown;
        collectionSlug?: unknown;
        data?: unknown;
        locale?: unknown;
      } | null;
      if (message?.type !== 'payload-live-preview') return;
      if (typeof message.collectionSlug !== 'string' || !message.data) return;
      sender.push({
        collection: message.collectionSlug,
        data: message.data,
        ...(typeof message.locale === 'string' ? { locale: message.locale } : {}),
      });
    };

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      sender.stop();
    };
  }, [router]);

  return null;
}
