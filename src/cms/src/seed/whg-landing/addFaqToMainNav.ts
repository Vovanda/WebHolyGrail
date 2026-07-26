import type { Payload } from 'payload';

type NavItem = { href: string; label: string; external?: boolean };

const FAQ_NAV_ITEM: NavItem = { href: '/faq', label: 'FAQ', external: false };

export async function addFaqToMainNav(
  payload: Payload,
): Promise<{ added: boolean; total: number }> {
  const settings = await payload.findGlobal({ slug: 'site-settings' });
  const nav: NavItem[] = (settings.mainNav ?? [])
    .filter(
      (item): item is { href: string; label: string; external?: boolean | null } =>
        typeof item.href === 'string' && typeof item.label === 'string',
    )
    .map((item) => ({
      href: item.href,
      label: item.label,
      external: item.external ?? false,
    }));

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
