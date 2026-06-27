/**
 * SEO helpers — canonical, absolute image URLs, schema.org JSON-LD for
 * a generic site. Domain-specific JSON-LD (an Animal, a Product, etc.) belongs
 * in the relevant `blocks/domain/<niche>/` module and should reuse the helpers
 * defined here.
 *
 * Strategy:
 *   - canonical → ALWAYS our own URL, never an upstream source — otherwise
 *     SEO weight leaks to a third-party site.
 *   - For aggregator-style pages that mirror an upstream resource, use
 *     `schema.org` `sameAs` to link to the upstream without surrendering canonical.
 *   - Source attribution stays in the visible DOM so the page is morally and
 *     legally clean as an aggregator.
 *   - Unique content (our photos / our copy / our context) makes Google pick us
 *     as canonical out of similar-looking pages.
 */

const DEFAULT_BASE_URL = 'https://example.com';
const DEFAULT_OG_IMAGE = '/branding/logo.png';

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_BASE_URL;
}

/** Absolute canonical URL — ALWAYS on our own domain. */
export function canonical(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl()}${p === '/' ? '' : p}`;
}

/** Absolute URL for an image. Accepts a relative path or an already-absolute URL. */
export function absoluteImage(src: string | null | undefined): string {
  if (!src) return `${baseUrl()}${DEFAULT_OG_IMAGE}`;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `${baseUrl()}${src.startsWith('/') ? src : `/${src}`}`;
}

/**
 * Generic `Organization` JSON-LD for the home page.
 *
 * Wire concrete fields (name, contacts, sameAs) from your SiteSettings or
 * an env-derived config — do not hard-code them here.
 */
export function organizationJsonLd(opts: {
  name: string;
  description?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
  sameAs?: ReadonlyArray<string> | undefined;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: opts.name,
    url: baseUrl(),
    logo: `${baseUrl()}${DEFAULT_OG_IMAGE}`,
    image: `${baseUrl()}${DEFAULT_OG_IMAGE}`,
    ...(opts.description && { description: opts.description }),
    ...(opts.email && { email: opts.email }),
    ...(opts.phone && { telephone: opts.phone }),
    ...(opts.address && {
      address: { '@type': 'PostalAddress', addressLocality: opts.address },
    }),
    ...(opts.sameAs && opts.sameAs.length > 0 && { sameAs: opts.sameAs }),
  };
}

/** Breadcrumb JSON-LD for nested pages — `BreadcrumbList`. */
export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : canonical(it.url),
    })),
  };
}
