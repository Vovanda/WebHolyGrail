import { notFound } from 'next/navigation';

import { getPageBySlug, getSiteSettings } from '@/lib/api-client';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import { renderBlockNode } from '@/layouts/site-layout';

/**
 * Catchall публичный маршрут — рендерит любую страницу из Payload Pages по slug.
 *
 * @remarks
 * - `/` → slug = `''` (главная)
 * - `/about` → slug = `'about'`
 * - `/contacts/visit` → slug = `'contacts/visit'` (если нужно nested URL'ы — мама задаёт slug целиком)
 *
 * Контент **только из БД** (R0). Если страница не найдена в Pages — 404.
 * Если найдена, но `blocks` пустой — рендерим пустой `<main>` (страница есть, но не наполнена).
 */
type Params = { slug?: string[] };

/** Маппинг URL-сегментов в slug Payload-страницы. Главная (`/`) → `home`. */
function resolveSlug(segments: string[] | undefined): string {
  const path = (segments ?? []).join('/');
  return path === '' ? 'home' : path;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getPageBySlug(resolveSlug(slug)).catch(() => null);
  if (!page) return {};

  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
  };
}

export default async function CatchallPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const [page, settings] = await Promise.all([
    getPageBySlug(resolveSlug(slug)).catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  if (!page) {
    notFound();
  }

  const activeSettings = settings ?? FALLBACK_SITE_SETTINGS;

  return (
    <>
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
              { blockType: block.blockType, id: block.id, data: block as Record<string, unknown> },
              activeSettings,
            )}
          </div>
        ))
      )}
    </>
  );
}
