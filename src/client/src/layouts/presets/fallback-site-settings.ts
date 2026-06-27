import type { SiteSettings } from 'contracts';

import { DEFAULT_THEME_CONFIG } from '@/lib/theme-bootstrap';
import { CLASSIC_SITE_LAYOUT } from './classic';

/**
 * Default SiteSettings — used when the CMS is unreachable or the global has
 * not been filled in yet (first launch). Guarantees the first page render is
 * never a blank screen.
 *
 * @remarks
 * Bare minimum so the home page can render: site name, basic contacts, stub
 * navigation, layout preset, theme default. The admin can then override every
 * value from the Payload admin UI.
 */
export const FALLBACK_SITE_SETTINGS: SiteSettings = {
  siteName: 'Example Site',
  contacts: {
    phone: '+1 555 0100',
    email: 'contact@example.com',
    address: 'City, Country',
  },
  mainNav: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ],
  social: [],
  theme: DEFAULT_THEME_CONFIG,
  layout: CLASSIC_SITE_LAYOUT,
};
