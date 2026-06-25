import { notFound } from 'next/navigation';

import { getPageBySlug, getSiteSettings } from '@/lib/api-client';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import { renderBlockNode } from '@/layouts/site-layout';

/**
 * Catchall публичный маршрут — рендерит страницу из Payload `Pages` по slug.
 *
 * - `/` → slug = `home`
 * - `/about` → slug = `about`
 * - `/contacts/visit` → slug = `contacts/visit` (nested URL'ы — slug целиком)
 *
 * Контент только из БД (R0). Не найдено → 404. Найдено, но `blocks` пустой →
 * сообщение для редактора в админке.
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
  const page = await getPageBySlug(resolveSlug(slug)).catch(() => null);
  if (page) {
    return {
      title: page.seo?.title ?? page.title,
      description: page.seo?.description,
    };
  }
  return {};
}

export default async function CatchallPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const [page, settings] = await Promise.all([
    getPageBySlug(resolveSlug(slug)).catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  if (!page) notFound();

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
