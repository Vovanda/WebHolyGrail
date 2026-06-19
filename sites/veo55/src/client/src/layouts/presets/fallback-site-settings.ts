import type { SiteSettings } from '@veo55/contracts';

import { DEFAULT_THEME_CONFIG } from '@/lib/theme-bootstrap';
import { CLASSIC_VEO55_LAYOUT } from './classic-veo55';

/**
 * Дефолтный SiteSettings — используется когда CMS недоступна или global ещё не
 * заполнен (первый запуск). Так первый запуск никогда не "пустой экран".
 *
 * @remarks
 * Контент-минимум который позволит главной отрендериться: имя сайта, базовые
 * контакты, навигация-заглушка, layout-preset, theme-дефолт. Реальные значения
 * админ потом меняет в Payload-админке.
 */
export const FALLBACK_SITE_SETTINGS: SiteSettings = {
  siteName: 'Питомник «Омская Дружина»',
  contacts: {
    phone: '+7 908 313 25 49',
    email: 'info@veo55.ru',
    address: 'Омск',
  },
  mainNav: [
    { href: '/', label: 'Главная' },
    { href: '/faq', label: 'Ответы на вопросы' },
    { href: '/news', label: 'Новости' },
    { href: '/catalog', label: 'Каталог собак' },
  ],
  social: [{ platform: 'vk', url: 'https://vk.com/veo55', label: 'ВКонтакте' }],
  theme: DEFAULT_THEME_CONFIG,
  layout: CLASSIC_VEO55_LAYOUT,
};
