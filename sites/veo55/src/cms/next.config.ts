import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

/**
 * Next config for Payload-only application (cms).
 * The site frontend (client) is a separate Next app under sites/veo55/src/client.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow images served by Payload Media (will be tightened when S3 / CDN domains are wired).
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost' }],
  },
  // Next 15 dev требует список origin'ов для cross-origin /_next/* запросов,
  // иначе chunks ломаются с `__webpack_require__.n is not a function`.
  // Demo-tunnel (veo.sawking.tech) + локальный nginx demo (8080).
  allowedDevOrigins: ['veo.sawking.tech', 'sawking.tech', '*.sawking.tech', 'localhost:8080'],
  // Payload writes generated config types here at build time.
  typescript: { ignoreBuildErrors: false },
  // We do not need eslint in cms build step — separate `pnpm lint` task.
  eslint: { ignoreDuringBuilds: true },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
