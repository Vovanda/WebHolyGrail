import type { MediaRef } from './media';
import type { LinkRef } from './blocks';

/**
 * Глобальные настройки сайта — синглтон. Источник правды — Payload Global `SiteSettings`.
 *
 * @remarks
 * Контакты, лого, навигация, реквизиты — то что одинаково для всех страниц.
 * Не путать с {@link PageDoc} — это страничный документ, может быть много.
 * Глобал — один на сайт.
 */
export interface SiteSettings {
  /** Имя сайта (для `<title>` суффикса, header). */
  readonly siteName: string;
  /** Лого в header. */
  readonly logo?: MediaRef;
  /** Контакты для footer и блока Contacts. */
  readonly contacts: ContactsInfo;
  /** Основная навигация в header. */
  readonly mainNav: readonly LinkRef[];
  /** Дополнительная навигация в footer (если отличается от main). */
  readonly footerNav?: readonly LinkRef[];
  /** Соцсети для footer. */
  readonly social?: readonly SocialLink[];
}

export interface ContactsInfo {
  /** Телефон для clickable `tel:` ссылки. Хранить в E.164: `+7912xxxxxxx`. */
  readonly phone?: string;
  /** Email для `mailto:`. */
  readonly email?: string;
  /** Физический адрес одной строкой. */
  readonly address?: string;
  /** Карта (Yandex/Google) — embed URL или координаты. */
  readonly mapEmbedUrl?: string;
}

export interface SocialLink {
  /** Идентификатор соцсети (vk, telegram, instagram, ...). Используется для иконки. */
  readonly platform: string;
  /** Полный URL профиля. */
  readonly url: string;
  /** Альтернативная подпись (если иконки нет). */
  readonly label?: string;
}
