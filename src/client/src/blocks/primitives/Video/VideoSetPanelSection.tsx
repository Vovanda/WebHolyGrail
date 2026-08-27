import { headers } from 'next/headers';
import type { BlockNode, VideoSetPanelBlockData } from 'contracts';

import { getPlaylistById } from '@/lib/api-client';

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
 * Плейлист не задан или пуст - панель молчит. Пустая панель с кнопкой сбоку
 * выглядит поломкой сильнее, чем её отсутствие.
 */
export interface VideoSetPanelSectionProps {
  readonly node: BlockNode;
}

export async function VideoSetPanelSection({ node }: VideoSetPanelSectionProps) {
  const data = (node.data ?? {}) as unknown as VideoSetPanelBlockData;

  const playlistId =
    typeof data.playlist === 'object' && data.playlist !== null
      ? data.playlist.id
      : (data.playlist ?? null);
  if (!playlistId) return null;

  // Куки зрителя пробрасываем: без них вошедший выглядит анонимом, и его
  // открытые видео показались бы закрытыми.
  const cookie = (await headers()).get('cookie') ?? '';
  const playlist = await getPlaylistById(playlistId, cookie);
  if (!playlist || playlist.items.length === 0) return null;

  return (
    <VideoSetPanelBody items={playlist.items} channel={playlist.channel} setCode={playlist.code} />
  );
}
