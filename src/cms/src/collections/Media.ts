import type { CollectionConfig } from 'payload';

/**
 * Media — uploaded files (images and documents).
 *
 * @remarks
 * Storage is S3-compatible (any provider — AWS S3, Cloudflare R2, Backblaze B2,
 * MinIO, etc.) wired in `payload.config.ts` via `@payloadcms/storage-s3`. The
 * plugin automatically sets `disableLocalStorage: true` for the attached
 * collection, so `staticDir` is intentionally absent here (leaving it on would
 * make Payload also write a local copy and serve it via `/api/media/...`, which
 * would override the CDN URL).
 *
 * Derived image sizes are produced by sharp on upload. The variant names match
 * the keys of `MediaDoc.sizes` in `contracts`.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медиафайл', plural: 'Медиа' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize'],
    group: 'Контент',
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: undefined, position: 'centre' },
      { name: 'card', width: 768, height: undefined, position: 'centre' },
      { name: 'hero', width: 1920, height: undefined, position: 'centre' },
    ],
    formatOptions: {
      format: 'webp',
      options: { quality: 82 },
    },
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt text',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describes the image for screen readers and search engines. Do not leave empty.',
      },
    },
    {
      // The field name `prefix` is the convention of `@payloadcms/storage-s3` (it
      // reads the field with exactly that slug, no extra setup needed).
      name: 'prefix',
      label: 'Bucket folder (optional)',
      type: 'text',
      defaultValue: 'media',
      admin: {
        description:
          'Sub-folder inside the S3 bucket. Default `media` (no sub-folder). With `useCompositePrefixes` the resulting key is `<this prefix>/<filename>`.',
        position: 'sidebar',
      },
    },
    {
      name: 'caption',
      label: 'Caption (optional)',
      type: 'text',
    },
  ],
  access: {
    read: () => true, // Публичный URL для медиа — без авторизации.
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  hooks: {
    /**
     * Cache-busting via `?v=<updatedAt>` appended to the public URL.
     *
     * Problem: many CDNs keep objects with a long TTL keyed by Etag. If the file
     * at S3 is replaced under the same key (re-uploaded through the admin with
     * the same filename, or written directly to the bucket out-of-band), the CDN
     * edge keeps serving the old copy from its cache.
     *
     * This hook appends `?v=<timestamp>` to `url` and to each `sizes.*.url`. Any
     * update of the Media record in Payload bumps `updatedAt` → the query string
     * changes → the CDN edge fetches the fresh file from S3 (the query string is
     * part of the cache key).
     *
     * Side-effect: if a file is replaced directly on S3 without saving the Media
     * record through the admin, busting will not trigger (`updatedAt` is
     * unchanged). In that case open the Media record in `/admin` and click Save
     * (touches `updatedAt`) so the CDN picks up the new version.
     */
    afterRead: [
      ({ doc }) => {
        if (!doc?.url) return doc;
        const v = doc.updatedAt ? new Date(doc.updatedAt as string | Date).getTime() : Date.now();
        const bust = (url: unknown): unknown => {
          if (typeof url !== 'string' || !url) return url;
          return url + (url.includes('?') ? '&' : '?') + `v=${v}`;
        };
        const sizes = doc.sizes as Record<string, { url?: unknown }> | undefined;
        return {
          ...doc,
          url: bust(doc.url),
          ...(sizes
            ? {
                sizes: Object.fromEntries(
                  Object.entries(sizes).map(([k, s]) => [k, { ...s, url: bust(s?.url) }]),
                ),
              }
            : {}),
        };
      },
    ],
  },
};
