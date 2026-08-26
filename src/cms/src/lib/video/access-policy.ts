/**
 * Политика доступа к потоку — единственное место, где решается «можно или нет».
 *
 * @remarks
 * Вынесено отдельным слоем не ради красоты: сюда придёт биллинг. Сейчас правило
 * простое — открытое видео смотрят все, закрытое только вошедшие. Когда
 * появятся подписки, меняется реализация этого интерфейса, а нарезка, эндпоинт
 * и плеер остаются нетронутыми.
 *
 * Инстанс шаблона может подставить свою реализацию — например, проверку оплаты
 * конкретного плейлиста — не трогая generic-код.
 */

/** Что известно о запрашивающем. */
export interface Viewer {
  /** `null` — не вошёл. */
  readonly userId: string | number | null;
  /**
   * Ролик загружен этим зрителем.
   *
   * @remarks
   * Автор смотрит своё всегда: иначе перед публикацией нельзя убедиться, что
   * залит нужный файл, — закрытый ролик не открылся бы даже тому, кто его
   * загрузил.
   *
   * Роль администратора площадки такого права не даёт: для чужой платной
   * подборки он посторонний, и молчаливый доступ ко всему превратил бы
   * управление сайтом в возможность выкачать чужое.
   */
  readonly ownsVideo?: boolean | undefined;
  /**
   * Наборы, открытые погашенными кодами.
   *
   * @remarks
   * Приходят из токена зрителя, записи в базе у них нет. Вход они не требуют:
   * промо-доступ по коду для того и существует, чтобы человек не заводил
   * учётную запись ради одного ролика.
   */
  readonly grantedPlaylists?: ReadonlyArray<string | number> | undefined;
}

/** Что известно о ролике. */
export interface RequestedVideo {
  readonly id: string | number;
  readonly access: 'public' | 'private';
}

export type AccessDecision =
  | { readonly allowed: true }
  /**
   * Причина нужна не для текста на странице — его владелец пишет сам, — а
   * чтобы отличать «войди» от «нет подписки»: это разные кнопки.
   */
  | { readonly allowed: false; readonly reason: 'sign-in-required' | 'not-entitled' };

export interface AccessPolicy {
  decide(video: RequestedVideo, viewer: Viewer): Promise<AccessDecision>;
}

/**
 * Базовая политика: вход или его отсутствие.
 *
 * @remarks
 * Оплаты в шаблоне нет, поэтому `not-entitled` здесь не возвращается никогда —
 * этот вариант существует для реализаций, которые придут после.
 */
export const signedInPolicy: AccessPolicy = {
  async decide(video, viewer) {
    if (video.access === 'public') return { allowed: true };
    return viewer.userId === null
      ? { allowed: false, reason: 'sign-in-required' }
      : { allowed: true };
  },
};
