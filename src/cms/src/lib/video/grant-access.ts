import type { AccessPolicy, Viewer } from './access-policy';
import { readViewerToken, sealEnvelope } from './envelope';

/**
 * Выдача доступа к потоку: проверить право, запечатать секрет для зрителя.
 *
 * @remarks
 * Сценарий не знает ни про Payload, ни про HTTP: ему передают уже прочитанный
 * видео и реализацию политики. Благодаря этому он проверяется юнит-тестами
 * один-в-один со спекой `spec/video/access-invariants.smt2`, без базы и сети.
 */

/** Видео в том виде, в каком его отдаёт каталог. */
export interface StreamRecord {
  readonly id: string | number;
  readonly access: 'public' | 'private';
  readonly status: 'pending' | 'processing' | 'ready' | 'failed';
  /** Секрет потока в base64. `null` — нарезки ещё нет. */
  readonly secret: string | null;
}

export type GrantResult =
  | { readonly ok: true; readonly envelope: string }
  | {
      readonly ok: false;
      /**
       * `not-ready` — видео ещё готовится; `sign-in-required` и `not-entitled`
       * приходят от политики; `bad-token` — токен зрителя не тот, просрочен
       * или испорчен.
       */
      readonly reason: 'not-ready' | 'sign-in-required' | 'not-entitled' | 'bad-token';
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
  // Токен разбираем первым: погашенный код дописывает право прямо в него, и
  // без этого политика не увидела бы того, что зритель только что открыл.
  const checked = readViewerToken(token, appSecret, nowSeconds);
  if (!checked.ok) return { ok: false, reason: 'bad-token' };

  const decision = await policy.decide(
    { id: video.id, access: video.access },
    { ...viewer, grantedPlaylists: checked.granted },
  );
  if (!decision.allowed) return { ok: false, reason: decision.reason };

  if (video.status !== 'ready' || !video.secret) return { ok: false, reason: 'not-ready' };

  return { ok: true, envelope: sealEnvelope(Buffer.from(video.secret, 'base64'), checked.key) };
}
