/**
 * Generic-социал-посты — единая модель для VK / Telegram / Instagram / любой
 * другой соц-сети, у которой есть лента сообщества.
 *
 * @remarks
 * R5++: модель не привязана к VK. Адаптер per-источник (`cms/src/lib/social/`)
 * мапит сырой ответ источника в `SocialPostDoc`. UI рендерит generic-карточку
 * `SocialPostCard` независимо от источника.
 *
 * Где какой источник:
 *  - **VK**: первый и боевой — `cms/src/lib/social/vk-adapter.ts`, `source: 'vk'`
 *  - **Telegram**: F-этап (`tg-adapter.ts`, `source: 'tg'`) — getUpdates / channel posts
 *  - **Instagram**: ещё не нужен (приватный API, OAuth)
 *
 * Контракт source — короткая enum-строка, расширяется в будущем.
 */

export type SocialSource = 'vk' | 'tg' | 'ig';

export interface SocialPostAuthor {
  /** `user` — живой человек / админ от своего имени. `channel` — само сообщество. */
  readonly type?: 'user' | 'channel';
  /** id на источнике (профиль или сообщество). */
  readonly id?: string;
  /** Имя — для человека `«Имя Фамилия»`, для сообщества — название. */
  readonly name: string;
  /** URL аватарки (50×50 или ближайший доступный). */
  readonly photo?: string;
  /** Ссылка на профиль/канал на источнике. */
  readonly url?: string;
}

export interface SocialPostMedia {
  readonly type: 'photo' | 'video';
  /** Прямой URL фото или превью видео. */
  readonly url: string;
  /** Размеры превью (если известны). Для адаптивной сетки и avoid CLS. */
  readonly width?: number;
  readonly height?: number;
  /** Только video: длительность секунд. */
  readonly duration?: number;
  /** Только video: подпись/название. */
  readonly title?: string;
  /** Только video: URL для встраивания через iframe. */
  readonly embedUrl?: string;
  /** Только video: каноническая страница на источнике. */
  readonly pageUrl?: string;
}

/**
 * Упоминание в тексте поста — server-side резолв.
 *  - `profile` — `[id123|name]` (VK) / `@username` (TG): ссылка на профиль
 *  - `hashtag` — `#тег`: ссылка на поиск по тегу
 *  - `dog` — кличка item из РКФ, резолвится через `dog-mentions`
 *    (свой extractor по словарю кличек + регэкспам)
 *  - `url` — голый URL в тексте
 */
export interface SocialPostMention {
  readonly start: number;
  readonly end: number;
  readonly type: 'profile' | 'hashtag' | 'dog' | 'url';
  /** URL куда вести по клику. */
  readonly url: string;
  /** Что отображать (часто = срез текста `[start..end]`). */
  readonly display: string;
  /** Доп. атрибуты per-тип: для `dog` — `{ dogId, rule }`. */
  readonly data?: Record<string, unknown>;
}

export interface SocialPostMetrics {
  readonly likes: number;
  readonly comments: number;
  readonly reposts: number;
  readonly views: number;
}

export interface SocialPostDoc {
  readonly id: string;
  readonly source: SocialSource;
  /** id поста на источнике (строкой — у TG это chat_id+message_id, у VK число). */
  readonly sourceId: string;
  /** id владельца ленты на источнике (для VK — отрицательный для сообщества). */
  readonly sourceOwnerId?: string;
  /** Канонический URL поста на источнике. */
  readonly sourceUrl: string;
  /** Unix-timestamp в секундах. */
  readonly date: number;
  /** Та же дата ISO для удобства рендера. */
  readonly dateIso: string;
  /** Сырой текст с переносами строк, без HTML. */
  readonly text: string;
  /** Медиа: фото + видео в одном массиве, порядок из источника. */
  readonly media?: readonly SocialPostMedia[];
  readonly author?: SocialPostAuthor;
  /** Server-side mentions для рендера в текст-ноды → ссылки. */
  readonly mentions?: readonly SocialPostMention[];
  readonly metrics: SocialPostMetrics;
  /** Дата последней синхронизации (для дельта-апдейтов и отладки). */
  readonly syncedAt?: string;
}

/**
 * Коммент к посту. Реплики (`replies`) — рекурсивно. У VK через
 * `thread_items_count=10`, у TG через repliesToMessage chains.
 */
export interface SocialComment {
  readonly id: string;
  /**
   * id коммента на источнике (для VK — comment_id из API). Группировка
   * `replies` по этому полю: `parentId` коммента-ответа равен `sourceId`
   * родительского коммента (VK `wall.getComments thread.items[].parents_stack`
   * хранит именно source-id, не наш Payload-id).
   */
  readonly sourceId?: string;
  readonly postId: string;
  readonly source: SocialSource;
  /** id владельца стены поста (для VK — отрицательное для сообщества). */
  readonly sourceOwnerId?: string;
  /**
   * `'0'` для top-level коммента, иначе **`sourceId`** родительского коммента
   * (НЕ наш Payload-id). При группировке `replies` нужно сопоставлять
   * `child.parentId === parent.sourceId`.
   */
  readonly parentId: string;
  readonly date: number;
  readonly dateIso: string;
  readonly text: string;
  readonly likes: number;
  readonly author: SocialPostAuthor;
  readonly replies?: readonly SocialComment[];
}

/** Фильтр периодов (legacy `news.html → .veo-news__chip[data-filter]`). */
export type SocialFeedFilter = 'all' | 'week' | 'month';

/** Блок-нода ленты соц-сети на странице. */
export interface SocialFeedBlockNode {
  readonly blockType: 'social-feed';
  readonly id: string;
  /** Какие источники включать. По умолчанию все доступные. */
  readonly sources?: readonly SocialSource[];
  /** Сколько постов показать на странице (default 30). */
  readonly count?: number;
  /** Скрыть N свежих (retention в исходной соц-сети). Default 2. */
  readonly hideLatest?: number;
  /** Показывать ли фильтр-чипы Все / Неделя / Месяц. Default true. */
  readonly showFilters?: boolean;
  /**
   * Для фильтра `week` — топ-N по engagement за 7 дней.
   * Engagement = likes + comments + reposts + (views / 200).
   * Default 3.
   */
  readonly weekTopN?: number;
  /** Аналогично для `month` — топ-N за 30 дней. Default 10. */
  readonly monthTopN?: number;
  /**
   * Регэксп для скрытия постов по тексту (legacy скрывает `#Эксклюзив`).
   * JavaScript regex без `/…/` — например `#эксклюз|#exclusive`.
   * Опционально; default — скрываем `#эксклюз` любой кейс.
   */
  readonly hideTagRegex?: string;
}
