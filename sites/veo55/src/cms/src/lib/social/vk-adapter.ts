/**
 * VK adapter — преобразует ответ VK API `wall.get` / `wall.getComments`
 * в generic `SocialPostDoc` / `SocialComment` (R5++).
 *
 * @remarks
 * Логика маппинга 1:1 с legacy `.tmp/legacy/news-helpers.php` (`veo_vk_map_post`,
 * `veo_vk_resolve_author`, `veo_vk_pick_photo`):
 *  - выбор «лучшего» фото — макс. площадь `width*height`
 *  - видео embed: `vk.com/video_ext.php?...hd=2&autoplay=1&allow_unauthorized=1`
 *  - автор: signer_id > from_id > fallback на сообщество
 *  - rate-limit backoff на error_code 6/29 (3 req/sec для service token)
 *
 * Под другие соц-сети — отдельные адаптеры (`tg-adapter.ts`, `ig-adapter.ts`).
 * UI работает с `SocialPostDoc` независимо от источника.
 *
 * Server-only (CMS). Никогда не импортить из `client/`.
 */

import type {
  SocialComment,
  SocialPostAuthor,
  SocialPostDoc,
  SocialPostMedia,
} from '@veo55/contracts';

const VK_API = 'https://api.vk.com/method';

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`vk-adapter: env ${name} не задан`);
  return v;
}

interface VkRawPhoto {
  sizes?: Array<{ width?: number; height?: number; url?: string }>;
}

interface VkRawVideo {
  owner_id?: number;
  id?: number;
  access_key?: string;
  title?: string;
  duration?: number;
  image?: Array<{ width?: number; height?: number; url?: string }>;
}

interface VkRawAttachment {
  type?: string;
  photo?: VkRawPhoto;
  video?: VkRawVideo;
}

interface VkRawProfile {
  id?: number;
  first_name?: string;
  last_name?: string;
  photo_50?: string;
}

interface VkRawGroup {
  id?: number;
  name?: string;
  photo_50?: string;
  photo_100?: string;
  photo_200?: string;
  screen_name?: string;
}

interface VkRawPost {
  id?: number;
  owner_id?: number;
  from_id?: number;
  signer_id?: number;
  date?: number;
  text?: string;
  attachments?: VkRawAttachment[];
  likes?: { count?: number };
  comments?: { count?: number };
  reposts?: { count?: number };
  views?: { count?: number };
}

interface VkRawComment {
  id?: number;
  from_id?: number;
  date?: number;
  text?: string;
  likes?: { count?: number };
  thread?: { items?: VkRawComment[] };
}

let errorStreak = 0;

async function vkCall<T>(method: string, params: Record<string, string | number>): Promise<T> {
  const search = new URLSearchParams({
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    access_token: env('VEO_VK_SVC_TOKEN'),
    v: env('VEO_VK_API_VER'),
  });

  if (errorStreak >= 5) {
    throw new Error(`vk-adapter: aborting after ${errorStreak} rate-limit errors in a row`);
  }

  const res = await fetch(`${VK_API}/${method}?${search.toString()}`, {
    headers: { 'User-Agent': 'veo55-cms/1.0' },
  });
  if (!res.ok) throw new Error(`vk-adapter: HTTP ${res.status} on ${method}`);
  const data = (await res.json()) as {
    response?: T;
    error?: { error_code?: number; error_msg?: string };
  };

  if (data.error) {
    const code = data.error.error_code ?? 0;
    if (code === 6 || code === 29) {
      errorStreak++;
      const backoff = Math.min(30_000, 5_000 * 2 ** (errorStreak - 1));
      console.warn(`[vk-adapter] rate-limit streak=${errorStreak}, backoff ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
      return vkCall<T>(method, params);
    }
    throw new Error(`vk-adapter: ${method} → ${data.error.error_msg ?? 'unknown'}`);
  }
  errorStreak = 0;
  if (data.response === undefined) {
    throw new Error(`vk-adapter: ${method} → empty response`);
  }
  // Service token = 3 req/sec → sleep 350ms между запросами.
  await new Promise((r) => setTimeout(r, 350));
  return data.response;
}

function pickPhotoUrl(photo: VkRawPhoto): { url: string; width: number; height: number } | null {
  let best: { url: string; width: number; height: number } | null = null;
  let area = 0;
  for (const s of photo.sizes ?? []) {
    const w = s.width ?? 0;
    const h = s.height ?? 0;
    const a = w * h;
    if (a > area && s.url) {
      area = a;
      best = { url: s.url, width: w, height: h };
    }
  }
  return best;
}

function pickVideoPreview(video: VkRawVideo): { url: string; width: number; height: number } {
  let best = { url: '', width: 0, height: 0 };
  let area = 0;
  for (const s of video.image ?? []) {
    const w = s.width ?? 0;
    const h = s.height ?? 0;
    const a = w * h;
    if (a > area && s.url) {
      area = a;
      best = { url: s.url, width: w, height: h };
    }
  }
  return best;
}

function resolveAuthor(
  signerId: number,
  fromId: number,
  profiles: VkRawProfile[],
  groups: VkRawGroup[],
): SocialPostAuthor | undefined {
  const targetUserId = signerId > 0 ? signerId : fromId > 0 ? fromId : 0;
  if (targetUserId > 0) {
    for (const u of profiles) {
      if (u.id === targetUserId) {
        return {
          type: 'user',
          id: String(targetUserId),
          name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
          photo: u.photo_50,
          url: `https://vk.com/id${targetUserId}`,
        };
      }
    }
  }
  if (fromId < 0) {
    const gid = -fromId;
    for (const g of groups) {
      if (g.id === gid) {
        return {
          type: 'channel',
          id: String(gid),
          name: g.name ?? 'Сообщество',
          photo: g.photo_50 ?? g.photo_100,
          url: `https://vk.com/${g.screen_name ?? `club${gid}`}`,
        };
      }
    }
  }
  return undefined;
}

function mapPost(
  post: VkRawPost,
  profiles: VkRawProfile[],
  groups: VkRawGroup[],
): Omit<SocialPostDoc, 'id' | 'syncedAt'> {
  const media: SocialPostMedia[] = [];
  for (const att of post.attachments ?? []) {
    if (att.type === 'photo' && att.photo) {
      const picked = pickPhotoUrl(att.photo);
      if (picked) {
        media.push({
          type: 'photo',
          url: picked.url,
          width: picked.width,
          height: picked.height,
        });
      }
    } else if (att.type === 'video' && att.video) {
      const v = att.video;
      const oid = v.owner_id ?? 0;
      const vid = v.id ?? 0;
      const hash = v.access_key ?? '';
      if (oid && vid) {
        const preview = pickVideoPreview(v);
        media.push({
          type: 'video',
          url: preview.url,
          width: preview.width,
          height: preview.height,
          duration: v.duration,
          title: v.title,
          embedUrl:
            `https://vk.com/video_ext.php?oid=${oid}&id=${vid}&hd=2&autoplay=1&allow_unauthorized=1` +
            (hash ? `&hash=${hash}` : ''),
          pageUrl: `https://vk.com/video${oid}_${vid}`,
        });
      }
    }
  }

  const groupId = Number(env('VEO_VK_GROUP_ID'));
  const postId = post.id ?? 0;
  const ownerId = post.owner_id ?? -groupId;
  const signerId = post.signer_id ?? 0;
  const fromId = post.from_id ?? ownerId;
  const date = post.date ?? 0;
  return {
    source: 'vk',
    sourceId: String(postId),
    sourceOwnerId: String(ownerId),
    sourceUrl: `https://vk.com/wall${ownerId}_${postId}`,
    date,
    dateIso: new Date(date * 1000).toISOString(),
    text: (post.text ?? '').trim(),
    media,
    author: resolveAuthor(signerId, fromId, profiles, groups),
    mentions: [],
    metrics: {
      likes: post.likes?.count ?? 0,
      comments: post.comments?.count ?? 0,
      reposts: post.reposts?.count ?? 0,
      views: post.views?.count ?? 0,
    },
  };
}

/** Получить N свежих постов сообщества — для sync-скрипта Posts collection. */
export async function vkFetchWall(
  count = 30,
  offset = 0,
): Promise<{
  posts: Array<Omit<SocialPostDoc, 'id' | 'syncedAt'>>;
  group: VkRawGroup | undefined;
}> {
  const groupId = env('VEO_VK_GROUP_ID');
  const response = await vkCall<{
    items: VkRawPost[];
    profiles?: VkRawProfile[];
    groups?: VkRawGroup[];
  }>('wall.get', {
    owner_id: `-${groupId}`,
    count,
    offset: Math.max(0, offset),
    extended: 1,
    fields: 'name,photo_200,photo_100,photo_50,description,first_name,last_name,screen_name',
  });
  const profiles = response.profiles ?? [];
  const groups = response.groups ?? [];
  const posts = response.items.map((p) => mapPost(p, profiles, groups));
  return { posts, group: groups[0] };
}

function mapComment(
  c: VkRawComment,
  profiles: VkRawProfile[],
  groups: VkRawGroup[],
  postId: string,
  sourceOwnerId: string,
  parentId = '0',
): SocialComment {
  const fromId = c.from_id ?? 0;
  let author: SocialPostAuthor = { name: 'Аноним', url: 'https://vk.com/' };
  if (fromId > 0) {
    for (const u of profiles) {
      if (u.id === fromId) {
        author = {
          type: 'user',
          id: String(fromId),
          name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
          photo: u.photo_50,
          url: `https://vk.com/id${fromId}`,
        };
        break;
      }
    }
  } else if (fromId < 0) {
    const gid = -fromId;
    for (const g of groups) {
      if (g.id === gid) {
        author = {
          type: 'channel',
          id: String(gid),
          name: g.name ?? 'Сообщество',
          photo: g.photo_50,
          url: `https://vk.com/club${gid}`,
        };
        break;
      }
    }
  }
  const date = c.date ?? 0;
  const id = String(c.id ?? 0);
  return {
    id,
    postId,
    source: 'vk',
    sourceOwnerId,
    parentId,
    date,
    dateIso: new Date(date * 1000).toISOString(),
    text: (c.text ?? '').trim(),
    likes: c.likes?.count ?? 0,
    author,
    replies: (c.thread?.items ?? [])
      .filter((r) => (r.text ?? '').trim().length > 0)
      .map((r) => mapComment(r, profiles, groups, postId, sourceOwnerId, id)),
  };
}

/** Комменты поста с ветками replies. */
export async function vkFetchComments(
  postId: string,
  count = 50,
  sourceOwnerId?: string,
): Promise<{ items: SocialComment[]; total: number }> {
  const id = Number(postId);
  if (id <= 0) return { items: [], total: 0 };
  const groupId = Number(env('VEO_VK_GROUP_ID'));
  const realOwnerId = sourceOwnerId ?? String(-groupId);
  const response = await vkCall<{
    items: VkRawComment[];
    count?: number;
    profiles?: VkRawProfile[];
    groups?: VkRawGroup[];
  }>('wall.getComments', {
    owner_id: realOwnerId,
    post_id: id,
    count,
    sort: 'asc',
    preview_length: 0,
    extended: 1,
    need_likes: 1,
    thread_items_count: 10,
    fields: 'first_name,last_name,photo_50',
  });
  const profiles = response.profiles ?? [];
  const groups = response.groups ?? [];
  const items = response.items
    .filter((c) => (c.text ?? '').trim().length > 0)
    .map((c) => mapComment(c, profiles, groups, postId, realOwnerId));
  return { items, total: response.count ?? items.length };
}
