import { notFound, permanentRedirect } from 'next/navigation';

import type { SiteSettings } from 'contracts';

import { getArticleBySlug, getPageBySlug, getSiteSettings } from '@/lib/api-client';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import { renderBlockNode } from '@/layouts/site-layout';
import { resolveMediaUrl } from '@/lib/media';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';

/**
 * Catchall публичный маршрут — рендерит страницу из Payload `Pages` по slug.
 *
 * - `/` → slug = `home`
 * - `/about` → slug = `about`
 * - `/contacts/visit` → slug = `contacts/visit` (nested URL'ы — slug целиком)
 *
 * Контент только из БД (R0). Найдено, но `blocks` пустой → сообщение для
 * редактора в админке.
 *
 * Если страницы нет, но есть статья с таким slug — 301 на `/blog/<slug>`. Так
 * переживают переезд ссылки с движков, где записи лежали в корне (Ghost,
 * WordPress): канонический адрес остаётся один, дублей контента не появляется.
 * Не нашлось ни того, ни другого → 404.
 *
 * Domain-маршруты (`/dogs`, `/puppies/...`, `/catalog/...` и т.п.) живут как
 * отдельные роуты в `app/(site)/<domain>/` соответствующих инстансов. В
 * template сюда не входят.
 */
type Params = { slug?: string[] };

function resolveSlug(segments: string[] | undefined): string {
  const path = (segments ?? []).join('/');
  return path === '' ? 'home' : path;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolved = resolveSlug(slug);
  const page = await getPageBySlug(resolved).catch(() => null);
  if (!page) return {};

  const title = page.seo?.title ?? page.title;
  const description = page.seo?.description;
  const image = resolveMediaUrl(page.seo?.ogImage);
  const canonical = page.seo?.canonical ?? (resolved === 'home' ? '/' : `/${resolved}`);

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    // Черновики и служебные страницы не должны попадать в выдачу.
    ...(page.seo?.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'website',
      title,
      ...(description ? { description } : {}),
      // Своя картинка страницы — если её нет, остаётся логотип из корневого
      // layout: пустой og:image мессенджер покажет как ссылку без превью.
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    ...(image ? { twitter: { card: 'summary_large_image' as const, images: [image] } } : {}),
  };
}

/**
 * Разметка сайта и владельца — только на главной: на остальных страницах она
 * дублируется и robots считает это шумом.
 */
function siteJsonLd(settings: SiteSettings): string {
  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'];
  const logo = resolveMediaUrl(settings.logo);
  const sameAs = (settings.social ?? []).map((s) => s.url).filter(Boolean);
  const { phone, email } = settings.contacts ?? {};

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: settings.siteName,
    ...(siteUrl ? { url: siteUrl } : {}),
    ...(logo ? { logo } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(phone || email
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            ...(phone ? { telephone: phone } : {}),
            ...(email ? { email } : {}),
          },
        }
      : {}),
  });
}

export default async function CatchallPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const [page, settings] = await Promise.all([
    getPageBySlug(resolveSlug(slug)).catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  if (!page) {
    const legacySlug = resolveSlug(slug);
    const article = await getArticleBySlug(legacySlug).catch(() => null);
    if (article) permanentRedirect(`/blog/${article.slug}`);
    notFound();
  }

  const activeSettings = settings ?? FALLBACK_SITE_SETTINGS;

  // Главная — корень, возвращаться с неё некуда. На остальных страницах крошки
  // нужны: сюда приходят по прямой ссылке, и без них единственный путь дальше —
  // кнопка «назад» в браузере.
  const crumbs = resolveSlug(slug) === 'home' ? [] : [{ label: 'Главная', href: '/' }];

  return (
    <>
      {resolveSlug(slug) === 'home' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: siteJsonLd(activeSettings) }}
        />
      )}
      {crumbs.length > 0 && (
        <div className="mx-auto max-w-wide px-4 md:px-6">
          <Breadcrumbs items={[...crumbs, { label: page.title }]} />
        </div>
      )}
      {page.blocks.length === 0 ? (
        <section className="py-24 text-center">
          <p className="text-muted font-display italic text-lg">
            Страница «{page.title}» создана, но блоки ещё не добавлены. Откройте админку и наполните
            её.
          </p>
        </section>
      ) : (
        page.blocks.map((block) => (
          <div key={block.id}>
            {renderBlockNode(
              {
                blockType: block.blockType,
                id: block.id,
                data: block as unknown as Record<string, unknown>,
              },
              activeSettings,
            )}
          </div>
        ))
      )}
    </>
  );
}
