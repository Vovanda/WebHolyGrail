'use client';

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react';
import { useRouter } from 'next/navigation';

import { CMS_URL } from '@/lib/cms-url';

/**
 * Обновление страницы в панели предпросмотра.
 *
 * @remarks
 * Панель рядом с формой держит эту же страницу в рамке и присылает ей весть
 * о каждом сохранении - в том числе о самосохранении черновика. Получив весть,
 * страница перезапрашивается на сервере и показывает свежую правку.
 *
 * Показ остаётся серверным (R14): в браузере живёт только этот слушатель,
 * а разметку по-прежнему собирает сервер. Обычному посетителю он ничего
 * не делает - весть приходит только из админки.
 *
 * Адрес CMS берётся из окружения: он разный у стенда и у рабочего сайта,
 * а сама весть принимается только от него.
 */
export function RefreshOnSave() {
  const router = useRouter();
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={CMS_URL} />;
}
