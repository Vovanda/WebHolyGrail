import type { NextConfig } from 'next';

/**
 * Next config for veo55 client (public frontend).
 *
 * @remarks
 * Client не знает про Payload напрямую (R3). CMS-URL задаётся через
 * `NEXT_PUBLIC_CMS_URL`, картинки Payload Media — через `remotePatterns`.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'cms' },
    ],
  },
  experimental: {
    // Сервер-компоненты Next 15 — дефолт. Тут можно future-флаги.
  },
};

export default nextConfig;
