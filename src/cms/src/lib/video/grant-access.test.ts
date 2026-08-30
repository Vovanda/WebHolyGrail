import { describe, expect, it } from 'vitest';

import { openOnlyPolicy } from './access-policy.js';
import { issueViewerToken, readViewerToken } from './viewer-token.js';
import { grantStreamAccess, type StreamRecord } from './grant-access.js';

/**
 * Зеркало spec/video/access-invariants.smt2.
 *
 * @remarks
 * Каждый случай здесь соответствует блоку ;@TEST в спеке — она ведущая, тест
 * догоняет. Меняется поведение — сначала правится спека и гоняется
 * verify_access.py, потом этот файл и код, и всё едет одним коммитом.
 */

const SECRET = 'app-secret-for-tests';
const NOW = 1_700_000_000;

const ready: StreamRecord = {
  id: 1,
  access: 'private',
  status: 'ready',
  secret: Buffer.from('0123456789abcdef').toString('base64'),
};

const grant = (
  video: StreamRecord,
  userId: string | number | null,
  token: string,
  ownsVideo = false,
) =>
  grantStreamAccess({
    video,
    viewer: { userId, ownsVideo },
    token,
    policy: openOnlyPolicy,
    appSecret: SECRET,
    nowSeconds: NOW,
  });

describe('токен зрителя', () => {
  it('выданный токен читается обратно с тем же идентичностью', () => {
    const token = issueViewerToken(SECRET, NOW);
    const checked = readViewerToken(token.value, SECRET, NOW);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.ref).toBe(token.ref);
  });

  it('подделанная подпись отвергается', () => {
    const token = issueViewerToken(SECRET, NOW);
    const tampered = `${token.value.slice(0, -4)}AAAA`;
    expect(readViewerToken(tampered, SECRET, NOW)).toMatchObject({ ok: false });
  });

  it('токен, выданный под другой секрет приложения, не проходит', () => {
    const token = issueViewerToken('другой секрет', NOW);
    expect(readViewerToken(token.value, SECRET, NOW)).toMatchObject({
      ok: false,
      reason: 'signature',
    });
  });

  it('просроченный токен не принимается', () => {
    const token = issueViewerToken(SECRET, NOW);
    const muchLater = NOW + 13 * 60 * 60;
    expect(readViewerToken(token.value, SECRET, muchLater)).toMatchObject({
      ok: false,
      reason: 'expired',
    });
  });
});

describe('выдача доступа', () => {
  it('аноним смотрит открытое', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const result = await grant({ ...ready, access: 'public' }, null, token.value);
    expect(result.ok).toBe(true);
  });

  it('закрытое без права не открывается', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const result = await grant(ready, null, token.value);
    expect(result).toMatchObject({ ok: false, reason: 'not-entitled' });
  });

  it('учётная запись сама по себе закрытое не открывает', async () => {
    // Вход условием выдачи не бывает: закрытое открывает право, а базовая
    // политика прав не знает вовсе.
    const token = issueViewerToken(SECRET, NOW);
    const result = await grant(ready, 42, token.value);
    expect(result).toMatchObject({ ok: false, reason: 'not-entitled' });
  });

  it('своё автор смотрит без всякого права', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const result = await grant(ready, 42, token.value, true);
    expect(result.ok).toBe(true);
  });

  it('после закрытия отказ тому же зрителю', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const wasOpen = { ...ready, access: 'public' as const };
    expect((await grant(wasOpen, null, token.value)).ok).toBe(true);

    const nowClosed = { ...ready, access: 'private' as const };
    expect(await grant(nowClosed, null, token.value)).toMatchObject({
      ok: false,
      reason: 'not-entitled',
    });
  });

  it('видео ещё в очереди — ключа нет ни в каком режиме', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const pending: StreamRecord = { ...ready, access: 'public', status: 'pending', secret: null };
    expect(await grant(pending, 42, token.value)).toMatchObject({ ok: false, reason: 'not-ready' });
  });

  it('отдаётся ключ того криптопериода, который подобрал вызывающий', async () => {
    // Криптопериод выбирает эндпоинт по номеру из адреса и кладёт сюда уже готовый
    // ключ: сценарий решает про право, а не про то, какой отрезок открывают.
    const result = await grant(ready, 42, issueViewerToken(SECRET, NOW).value, true);
    expect(result).toEqual({ ok: true, key: ready.secret });
  });

  it('испорченный токен не даёт доступа даже автору', async () => {
    expect(await grant(ready, 42, 'не.токен.вовсе', true)).toMatchObject({
      ok: false,
      reason: 'bad-token',
    });
  });

  it('право находится по опознанию из токена, а не по пометке в нём', async () => {
    // Права ушли из токена в записи: пока они лежали внутри, снять их было
    // нельзя - сервер о них не знал. Токен теперь предъявляет идентичность,
    // а находит право по нему политика.
    const appSecret = 'секрет-приложения';
    const now = 1_000_000;
    const token = issueViewerToken(appSecret, now);

    const result = await grantStreamAccess({
      video: {
        id: 2,
        access: 'private',
        status: 'ready',
        secret: Buffer.from('0123456789abcdef').toString('base64'),
      },
      viewer: { userId: null },
      token: token.value,
      policy: {
        async decide(_video, viewer) {
          return viewer.ref === token.ref
            ? { allowed: true }
            : { allowed: false, reason: 'not-entitled' };
        },
      },
      appSecret,
      nowSeconds: now,
    });

    expect(result.ok).toBe(true);
  });

  it('чужая идентичность своих прав не открывает', async () => {
    const appSecret = 'секрет-приложения';
    const now = 1_000_000;
    const mine = issueViewerToken(appSecret, now);
    const other = issueViewerToken(appSecret, now);

    const result = await grantStreamAccess({
      video: { id: 2, access: 'private', status: 'ready', secret: 'AAAAAAAAAAAAAAAAAAAAAA==' },
      viewer: { userId: null },
      token: other.value,
      policy: {
        async decide(_video, viewer) {
          // Право записано на первого зрителя: у второго идентичность другое.
          return viewer.ref === mine.ref
            ? { allowed: true }
            : { allowed: false, reason: 'not-entitled' };
        },
      },
      appSecret,
      nowSeconds: now,
    });

    expect(result).toMatchObject({ ok: false, reason: 'not-entitled' });
  });
});
