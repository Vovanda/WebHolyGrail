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
  // Payload writes generated config types here at build time.
  typescript: { ignoreBuildErrors: false },
  // We do not need eslint in cms build step — separate `pnpm lint` task.
  eslint: { ignoreDuringBuilds: true },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
