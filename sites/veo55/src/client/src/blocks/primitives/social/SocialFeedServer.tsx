import type { BlockNode, SiteSettings, SocialSource } from '@veo55/contracts';

import { listPosts } from '@/lib/api-client';

import { SocialFeed } from './SocialFeed';

/**
 * SocialFeedServer — серверный wrapper над {@link SocialFeed}.
 *
 * @remarks
 * Регистрируется в `block-registry` как блок `social-feed`. Тянет Posts через
 * Payload REST API + group-info из env, передаёт в client `<SocialFeed/>`
 * для фильтр-переключения.
 *
 * **Group info** берётся из ENV:
 *  - `VK_GROUP_NAME`        — название сообщества для шапки
 *  - `VK_GROUP_URL`         — публичный URL `https://vk.com/<screen_name>`
 *  - `VK_GROUP_ME_URL`      — VK.Me-чат `https://vk.me/<screen_name>`
 *  - `VK_GROUP_PHOTO`       — URL аватарки сообщества (необязательно)
 *
 * Если что-то не задано — есть веоязные дефолты (питомник veo55). Для других
 * сайтов перебиваются через `.env.local`.
 */
export interface SocialFeedData {
  readonly sources?: readonly SocialSource[];
  readonly count?: number;
  readonly hideLatest?: number;
  readonly showFilters?: boolean;
  readonly weekTopN?: number;
  readonly monthTopN?: number;
  readonly hideTagRegex?: string;
}

export async function SocialFeedServer({
  node,
}: {
  readonly node: BlockNode & { data?: Partial<SocialFeedData> };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const sources: readonly SocialSource[] = (data.sources ?? ['vk']) as SocialSource[];
  const count = data.count ?? 30;
  const hideLatest = data.hideLatest ?? 2;
  const showFilters = data.showFilters ?? true;
  const weekTopN = data.weekTopN ?? 3;
  const monthTopN = data.monthTopN ?? 10;
  const hideTagRegex = data.hideTagRegex ?? '#эксклюз';

  // Тянем посты с buffer (для фильтра «За месяц» нужно больше чем count).
  // 200 = практический максимум — за месяц редко больше постов у нишевого
  // питомника. Если выйдем за — следующая итерация infinite scroll.
  const posts = await listPosts({ sources, limit: Math.max(count, 200) }).catch(() => []);

  // Короткое название для VK-чипа (1:1 с legacy `.veo-news__group` — там
  // «Омская Дружина», а не «Питомник ВЕО "Омская Дружина"»). Полное имя
  // используется в seo-meta и других местах через `VK_GROUP_NAME`.
  const groupName = process.env.VK_GROUP_SHORT_NAME ?? '«Омская Дружина»';
  const groupUrl = process.env.VK_GROUP_URL ?? 'https://vk.com/veoomsk';
  const groupMeUrl = process.env.VK_GROUP_ME_URL ?? 'https://vk.me/veoomsk';
  const groupPhoto = process.env.VK_GROUP_PHOTO ?? undefined;

  return (
    <SocialFeed
      posts={posts}
      groupName={groupName}
      groupPhoto={groupPhoto}
      groupUrl={groupUrl}
      groupMeUrl={groupMeUrl}
      config={{
        sources,
        count,
        hideLatest,
        showFilters,
        weekTopN,
        monthTopN,
        hideTagRegex,
      }}
    />
  );
}
