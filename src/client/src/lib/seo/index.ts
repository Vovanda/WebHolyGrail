/**
 * SEO helpers — canonical, JSON-LD, og-image fallback, ассеты.
 *
 * Стратегия (агрегация без ущерба):
 *   - canonical → ВСЕГДА на наш URL (не на источник), иначе SEO-вес уходит другому сайту
 *   - Schema.org `sameAs` — для указания связи с внешним источником (РКФ) без передачи canonical
 *   - Source attribution в видимом DOM — морально и юридически чисто как агрегатор
 *   - Уникальный контент: наши фото + наши комментарии + контекст питомника — Google выбирает нас как canonical из похожих
 */

const DEFAULT_BASE_URL = 'https://veo55.ru';
const DEFAULT_KENNEL_NAME = 'Питомник ВЕО «Омская Дружина»';
const DEFAULT_OG_IMAGE = '/branding/logo.png';

export function baseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_BASE_URL;
}

/** Абсолютный canonical URL — ВСЕГДА на наш домен. */
export function canonical(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl()}${p === '/' ? '' : p}`;
}

/** Абсолютный URL изображения. Принимает относительный путь или уже абсолютный. */
export function absoluteImage(src: string | null | undefined): string {
  if (!src) return `${baseUrl()}${DEFAULT_OG_IMAGE}`;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return `https:${src}`;
  return `${baseUrl()}${src.startsWith('/') ? src : `/${src}`}`;
}

export const kennel = {
  name: DEFAULT_KENNEL_NAME,
  url: () => baseUrl(),
  logoUrl: () => `${baseUrl()}${DEFAULT_OG_IMAGE}`,
};

/**
 * JSON-LD для главной питомника (BreedingService + Organization).
 * Вставляется в layout главной как `<script type="application/ld+json">`.
 */
export function breedingServiceJsonLd(opts?: {
  description?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': ['BreedingService', 'Organization'],
    name: kennel.name,
    url: kennel.url(),
    logo: kennel.logoUrl(),
    image: kennel.logoUrl(),
    ...(opts?.description && { description: opts.description }),
    ...(opts?.email && { email: opts.email }),
    ...(opts?.phone && { telephone: opts.phone }),
    ...(opts?.address && {
      address: { '@type': 'PostalAddress', addressLocality: opts.address },
    }),
    knowsAbout: 'Восточноевропейская овчарка (ВЕО)',
    areaServed: { '@type': 'Country', name: 'Россия' },
    sameAs: ['https://vk.com/veoomsk', 'https://www.youtube.com/veoomsk', 'https://t.me/veoomsk'],
  };
}

/**
 * JSON-LD для конкретной собаки (наша Dogs collection или RKF proxy).
 * Schema.org `Animal` — Google индексирует как pet/animal с фото/breeder.
 */
export function dogJsonLd(opts: {
  name: string;
  slug?: string | undefined; // для нашей собаки
  rkfId?: number | undefined; // для РКФ proxy
  sex?: 'male' | 'female' | undefined;
  dob?: string | undefined;
  imageUrl?: string | undefined;
  description?: string | undefined;
  fatherName?: string | undefined;
  motherName?: string | undefined;
}): Record<string, unknown> {
  const url = opts.slug
    ? canonical(`/dog/${opts.slug}`)
    : opts.rkfId
      ? canonical(`/catalog?dog=${opts.rkfId}`)
      : canonical('/');
  const sameAs: string[] = [];
  if (opts.rkfId) sameAs.push(`https://veorkf.ru/catalog/dog-${opts.rkfId}.html`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Animal',
    name: opts.name,
    url,
    ...(opts.imageUrl && { image: absoluteImage(opts.imageUrl) }),
    ...(opts.description && { description: opts.description }),
    ...(opts.sex && { gender: opts.sex === 'male' ? 'Male' : 'Female' }),
    ...(opts.dob && { birthDate: opts.dob.slice(0, 10) }),
    additionalType: 'https://schema.org/Pet',
    species: { '@type': 'Text', name: 'Canis lupus familiaris' },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Порода', value: 'Восточноевропейская овчарка' },
    ],
    ...(opts.fatherName || opts.motherName
      ? {
          parents: [
            ...(opts.fatherName
              ? [{ '@type': 'Animal', name: opts.fatherName, gender: 'Male' }]
              : []),
            ...(opts.motherName
              ? [{ '@type': 'Animal', name: opts.motherName, gender: 'Female' }]
              : []),
          ],
        }
      : {}),
    ...(sameAs.length > 0 && { sameAs }),
    provider: {
      '@type': 'Organization',
      name: kennel.name,
      url: kennel.url(),
    },
  };
}

/** Breadcrumb для nested страниц — `BreadcrumbList`. */
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
