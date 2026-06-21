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
      // Прод-домены проксирующего nginx (через VPS sawking.tech)
      { protocol: 'https', hostname: 'sawking.tech' },
      { protocol: 'https', hostname: '*.sawking.tech' },
    ],
  },
  // Next 15 dev блокирует cross-origin запросы к `/_next/*` от внешних
  // origin'ов — браузер падает с `__webpack_require__.n is not a function`,
  // т.к. chunks возвращаются 403 без CORS-headers. Разрешаем demo-tunnel
  // (veo.sawking.tech) и временные Cloudflare-tunnel'ы.
  // Доку: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ['veo.sawking.tech', 'sawking.tech', '*.sawking.tech', '*.trycloudflare.com'],
  experimental: {
    // Сервер-компоненты Next 15 — дефолт. Тут можно future-флаги.
  },
};

export default nextConfig;
