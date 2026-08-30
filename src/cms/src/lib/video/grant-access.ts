import type { AccessPolicy, Viewer } from './access-policy';
import { readViewerToken } from './viewer-token';

/**
 * Выдача доступа к потоку: проверить право и отдать ключ запрошенной криптопериодовы.
 *
 * @remarks
 * Сценарий не знает ни про Payload, ни про HTTP: ему передают уже прочитанный
 * видео и реализацию политики. Благодаря этому он проверяется юнит-тестами
 * один-в-один со спекой `spec/video/access-invariants.smt2`, без базы и сети.
 *
 * Право проверяется на каждом запросе, а ключей у записи столько, сколько криптопериодов.
 * Отсюда и отзыв: отозванное перестаёт открывать на ближайшей границе криптопериода,
 * а не после того, как зритель досмотрит.
 */

/** Видео в том виде, в каком его отдаёт каталог. */
export interface StreamRecord {
  readonly id: string | number;
  readonly access: 'public' | 'private';
  readonly status: 'pending' | 'processing' | 'ready' | 'failed';
  /** Ключ запрошенной криптопериодовы в base64. `null` — нарезки ещё нет. */
  readonly secret: string | null;
}

export type GrantResult =
  | { readonly ok: true; readonly key: string }
  | {
      readonly ok: false;
      /**
       * `not-ready` — видео ещё готовится; `not-entitled` приходит
       * от политики; `bad-token` — токен зрителя не тот, просрочен
       * или испорчен.
       */
      readonly reason: 'not-ready' | 'not-entitled' | 'bad-token';
    };

export interface GrantArgs {
  readonly video: StreamRecord;
  readonly viewer: Viewer;
  readonly token: string;
  readonly policy: AccessPolicy;
  readonly appSecret: string;
  readonly nowSeconds: number;
}

export async function grantStreamAccess({
  video,
  viewer,
  token,
  policy,
  appSecret,
  nowSeconds,
}: GrantArgs): Promise<GrantResult> {
  // Токен разбираем первым: в нём идентичность зрителя, по которому политика
  // найдёт его права. Прав сам токен не носит - они записаны отдельно.
  const checked = readViewerToken(token, appSecret, nowSeconds);
  if (!checked.ok) return { ok: false, reason: 'bad-token' };

  const decision = await policy.decide(
    { id: video.id, access: video.access },
    { ...viewer, ref: checked.ref },
  );
  if (!decision.allowed) return { ok: false, reason: decision.reason };

  if (video.status !== 'ready' || !video.secret) return { ok: false, reason: 'not-ready' };

  return { ok: true, key: video.secret };
}
