import type { NextConfig } from 'next';

/**
 * Next config for the public client frontend.
 *
 * @remarks
 * Client does not know about Payload directly (R3). The CMS URL is provided via
 * `NEXT_PUBLIC_CMS_URL`, and Payload Media images are allow-listed in
 * `remotePatterns`. Extend `remotePatterns` and `allowedDevOrigins` per instance
 * with the production domain(s) and any demo-tunnel hostnames you use.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'cms' },
    ],
  },
  // Next 15 dev blocks cross-origin requests to `/_next/*` from external origins —
  // the browser otherwise fails with `__webpack_require__.n is not a function`
  // because chunks return 403 without CORS headers. Add demo-tunnel hostnames
  // and temporary tunnel domains (e.g. `*.trycloudflare.com`) per instance.
  // Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // Next 15 Server Components are the default. Add future flags here.
  },
  /**
   * Адреса каналов в стиле `/@имя`.
   *
   * @remarks
   * Папкой это не сделать: `@` в начале сегмента Next трактует как
   * параллельный маршрут, а не как символ адреса. Поэтому наружу отдаём
   * `/@имя/...`, а внутри живёт обычный сегмент `/channel/имя/...`.
   *
   * Именно перезапись, а не переадресация: адрес в строке браузера должен
   * остаться тем, который человек скопирует и отправит.
   */
  async rewrites() {
    return [
      { source: '/@:channel', destination: '/channel/:channel' },
      { source: '/@:channel/:path*', destination: '/channel/:channel/:path*' },
    ];
  },
};

export default nextConfig;
