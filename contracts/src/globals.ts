import type { MediaRef } from './media';
import type { LinkRef } from './blocks';
import type { ThemeConfig } from './theme';
import type { SiteLayoutConfig } from './layout';

/**
 * Пункт меню — ссылка, у которой может быть один уровень вложенности.
 *
 * @remarks
 * Отдельный тип, а не расширение {@link LinkRef}: тот описывает ссылки внутри
 * блоков, где вложенность бессмысленна. Уровень ровно один — меню сайта,
 * а не файловое дерево; вторая вложенность на телефоне уже не открывается
 * пальцем и в шапке не помещается.
 */
export interface NavItem {
  /** Внутренний путь (`/about`) или абсолютный URL. */
  readonly href: string;
  /** Подпись пункта. */
  readonly label: string;
  /** Открывать ли в новой вкладке. */
  readonly external?: boolean;
  /** Подпункты — разделы внутри направления. */
  readonly children?: readonly LinkRef[];
}

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
  readonly mainNav: readonly NavItem[];
  /** Дополнительная навигация в footer (если отличается от main). */
  readonly footerNav?: readonly NavItem[];
  /** Соцсети для footer. */
  readonly social?: readonly SocialLink[];
  /** Конфигурация темы (light/dark/auto + user-toggle). */
  readonly theme?: ThemeConfig;
  /** Поведение шапки: держится ли она наверху при прокрутке. */
  readonly header?: HeaderSettings;
  /** Шаг секции по вертикали - общий для всех блоков страницы. */
  readonly blockSpace?: BlockSpaceSettings;
  /** Конфигурация layout — какие панели в каких слотах. См. R11. */
  readonly layout?: SiteLayoutConfig;
  /** Настройки видео, которые нужны странице. */
  readonly video?: VideoSettings;
}

/**
 * Поведение шапки сайта.
 *
 * @remarks
 * По умолчанию шапка уезжает вместе со страницей, а наверху остаётся одна
 * кнопка меню - она липкая сама по себе и от этой настройки не зависит.
 * Владелец включает липкость, когда меню должно быть под рукой всё время.
 */
export interface HeaderSettings {
  /** Шапка держится наверху при прокрутке. По умолчанию нет. */
  readonly sticky?: boolean;
}

/**
 * Шаг секции по вертикали.
 *
 * @remarks
 * Одно значение на все блоки страницы: владелец подбирает воздух разом, а не
 * блок за блоком. Отдельному блоку он по-прежнему задаёт своё - «Вид блока»
 * перебивает общий шаг.
 *
 * Значений два: узкий экран и широкий. Пишутся как есть, любой мерой CSS -
 * «1rem», «24px», «2.5vh»; пусто означает взять то, что задано в коде.
 */
export interface BlockSpaceSettings {
  /** Шаг на узком экране. По умолчанию один шрифт. */
  readonly narrow?: string;
  /** Шаг на широком экране, от 768 точек. По умолчанию полтора шрифта. */
  readonly wide?: string;
}

export interface ContactsInfo {
  /** Телефон для clickable `tel:` ссылки. Хранить в E.164: `+7912xxxxxxx`. */
  readonly phone?: string;
  /** Email для `mailto:`. */
  readonly email?: string;
  /** Физический адрес одной строкой. */
  readonly address?: string;
  /** Часы работы одной строкой: «ПН-ВС 11:00–22:00». */
  readonly hours?: string;
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

/**
 * Настройки видео, видимые сайту.
 *
 * @remarks
 * Здесь только то, что влияет на показ. Длина кода и срок его жизни остаются
 * в CMS: они нужны при выдаче кода, а странице о них знать незачем.
 */
export interface VideoSettings {
  /** Что показывать вместо закрытой записи. */
  readonly denied?: VideoDeniedSettings;
}

/**
 * Заглушка вместо закрытой записи.
 *
 * @remarks
 * Зритель, которому запись не открыта, должен понимать, что делать дальше.
 * Владелец задаёт это сам: у одного сайта это код доступа, у другого подписка,
 * у третьего вход в учётную запись.
 */
export interface VideoDeniedSettings {
  readonly title?: string;
  readonly note?: string;
  readonly actionLabel?: string;
  readonly actionHref?: string;
  /** Текст на время, пока нарезка ещё идёт. */
  readonly notReadyTitle?: string;
}
