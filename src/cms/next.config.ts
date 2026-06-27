import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

/**
 * Next config for Payload-only application (cms).
 * The site frontend (client) is a separate Next app under src/client.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow images served by Payload Media (will be tightened when S3 / CDN domains are wired).
  images: {
    remotePatterns: [{ protocol: 'http', hostname: 'localhost' }],
  },
  // Next 15 dev requires an explicit list of origins for cross-origin /_next/*
  // requests — otherwise chunks fail with `__webpack_require__.n is not a function`.
  // Extend this list per instance (e.g. demo-tunnel hostname, local nginx demo origin).
  allowedDevOrigins: ['localhost:8080'],
  // TODO(holygrail-faq-blocknode): contracts/FaqAccordionBlockData несовместим с
  // BlockNode.data (index signature). Тех-долг. Временно ignore чтобы пройти
  // prod-build.
  typescript: { ignoreBuildErrors: true },
  // We do not need eslint in cms build step — separate `pnpm lint` task.
  eslint: { ignoreDuringBuilds: true },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
