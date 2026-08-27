import { headers } from 'next/headers';
import type { BlockNode, VideoSetPanelBlockData } from 'contracts';

import { getPlaylistByCode, getPlaylistById } from '@/lib/api-client';
import { PATHNAME_HEADER, SEARCH_HEADER } from '@/lib/pathname-header';

import { VideoSetPanelBody } from './VideoSetPanelBody';

/**
 * Плейлист боковой панелью.
 *
 * @remarks
 * Панель объявляется раскладкой сайта, а не собирается внутри плеера: любая
 * следующая панель - фильтры каталога, оглавление статьи - получает сдвиг
 * страницы, закрытие и кнопку даром, а блоку остаётся только содержимое.
 *
 * Серверный (R14): список собирается при показе, потому что замок у каждого
 * видео считается по конкретному зрителю.
 *
 * Плейлист берётся из адреса, когда он там есть: на странице отдельного видео
 * он приходит именно оттуда, и панель должна показывать тот, из которого зритель
 * пришёл, а не заданный в настройках. Нет в адресе - остаётся настроенный.
 *
 * Плейлист не задан или пуст - панель молчит. Пустая панель с кнопкой сбоку
 * выглядит поломкой сильнее, чем её отсутствие.
 */
export interface VideoSetPanelSectionProps {
  readonly node: BlockNode;
}

/**
 * Откуда пришёл зритель: канал в пути, код плейлиста в запросе.
 *
 * @remarks
 * Отдельно от запроса к серверу, чтобы разбор адреса проверялся без сети.
 * Одного куска мало: код плейлиста без канала не найти, а канал без кода
 * ничего не говорит о том, какой плейлист открыт.
 */
export function playlistFromAddress(
  pathname: string | null,
  search: string | null,
): { readonly channel: string; readonly code: string } | null {
  const code = new URLSearchParams(search ?? '').get('set');
  if (!code) return null;

  const channel = (pathname ?? '').match(/^\/@([^/]+)/)?.[1];
  if (!channel) return null;

  return { channel: decodeURIComponent(channel), code };
}

/** Плейлист, из которого зритель пришёл. */
async function fromAddress(head: Headers, cookie: string) {
  const asked = playlistFromAddress(head.get(PATHNAME_HEADER), head.get(SEARCH_HEADER));
  if (!asked) return null;

  return getPlaylistByCode(asked.channel, asked.code, cookie).catch(() => null);
}

/** Плейлист, заданный владельцем в раскладке. */
async function fromSettings(data: VideoSetPanelBlockData, cookie: string) {
  const id =
    typeof data.playlist === 'object' && data.playlist !== null
      ? data.playlist.id
      : (data.playlist ?? null);
  if (!id) return null;

  return getPlaylistById(id, cookie).catch(() => null);
}

export async function VideoSetPanelSection({ node }: VideoSetPanelSectionProps) {
  const data = (node.data ?? {}) as unknown as VideoSetPanelBlockData;

  const head = await headers();
  // Куки зрителя пробрасываем: без них вошедший выглядит анонимом, и его
  // открытые видео показались бы закрытыми.
  const cookie = head.get('cookie') ?? '';

  const playlist = (await fromAddress(head, cookie)) ?? (await fromSettings(data, cookie));
  if (!playlist || playlist.items.length === 0) return null;

  return (
    <VideoSetPanelBody items={playlist.items} channel={playlist.channel} setCode={playlist.code} />
  );
}
