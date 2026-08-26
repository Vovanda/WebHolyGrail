import type { AccessDecision, AccessPolicy, RequestedVideo, Viewer } from './access-policy';

/**
 * Политика доступа с правами на наборы.
 *
 * @remarks
 * Правило, доказанное в `spec/video/access-invariants.smt2`: открытый ролик
 * смотрят все, даже находясь в платном наборе; закрытый открывается, если у
 * зрителя есть право хотя бы на один набор, куда этот ролик входит.
 *
 * «Хотя бы один» — не поблажка, а естественное следствие: один и тот же урок
 * встречается в нескольких курсах, и купивший любой из них должен его
 * смотреть.
 */

/** Откуда берутся права. Отделено, чтобы политику можно было проверить без базы. */
export interface EntitlementSource {
  /**
   * Наборы, где состоит ролик и на которые у зрителя есть действующее право.
   * Пусто — прав нет.
   */
  entitledPlaylistsFor(
    videoId: string | number,
    viewerId: string | number,
    now: Date,
  ): Promise<ReadonlyArray<string | number>>;
}

export function entitlementPolicy(
  source: EntitlementSource,
  now: () => Date = () => new Date(),
): AccessPolicy {
  return {
    async decide(video: RequestedVideo, viewer: Viewer): Promise<AccessDecision> {
      if (video.access === 'public') return { allowed: true };

      // Не вошёл — права быть не может: оно всегда чьё-то.
      if (viewer.userId === null) return { allowed: false, reason: 'sign-in-required' };

      const entitled = await source.entitledPlaylistsFor(video.id, viewer.userId, now());
      if (entitled.length > 0) return { allowed: true };

      // Вошёл, но права нет — это уже не «войди», а «нужен доступ»: тексты
      // и кнопки у этих случаев разные.
      return { allowed: false, reason: 'not-entitled' };
    },
  };
}
