import type { MediaDoc, MediaRef } from 'contracts';

/**
 * resolveMediaUrl — превращает MediaRef в абсолютный URL для рендера.
 *
 * @remarks
 * Payload media URL может приходить как:
 *  - absolute (http(s)://...) — CDN / S3 public bucket → отдаём как есть
 *  - root-relative (/files/...) — local-disk storage → prefix через CMS_URL
 *  - prefix-relative (placeholder/...) — S3 storage с custom prefix → тот же CMS_URL
 *
 * Browser на :3000 не дойдёт до Payload-сервера на :3001 без префикса, поэтому
 * любой относительный URL клеим к NEXT_PUBLIC_CMS_URL.
 *
 * Возвращает null если ref пуст или это просто id-строка (нет populated объекта).
 */
const CMS_URL = (
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_CMS_URL
    ? process.env.NEXT_PUBLIC_CMS_URL
    : 'http://localhost:3001'
).replace(/\/$/, '');

export function resolveMediaUrl(ref: MediaRef | null | undefined): string | null {
  if (!ref || typeof ref !== 'object') return null;
  const url = (ref as MediaDoc).url;
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  // root-relative or prefix-relative — клеим CMS-prefix
  return `${CMS_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}
