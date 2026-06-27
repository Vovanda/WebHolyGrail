import type { Payload } from 'payload';

const FAQ_NAV_ITEM = { href: '/faq', label: 'FAQ', external: false };

/**
 * Добавляет /faq в mainNav SiteSettings, если ещё нет.
 * Идемпотентно по href.
 */
export async function addFaqToMainNav(
  payload: Payload,
): Promise<{ added: boolean; total: number }> {
  const settings = await payload.findGlobal({ slug: 'site-settings' });
  const nav = (settings.mainNav ?? []) as Array<{
    href?: string | null;
    label?: string | null;
    external?: boolean | null;
  }>;

  if (nav.some((item) => item.href === FAQ_NAV_ITEM.href)) {
    return { added: false, total: nav.length };
  }

  const next = [...nav, FAQ_NAV_ITEM];
  await payload.updateGlobal({
    slug: 'site-settings',
    data: { mainNav: next },
  });
  return { added: true, total: next.length };
}
