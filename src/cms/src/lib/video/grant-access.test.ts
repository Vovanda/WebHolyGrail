import { createDecipheriv } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { signedInPolicy } from './access-policy.js';
import { issueViewerToken, readViewerToken } from './envelope.js';
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

const grant = (video: StreamRecord, userId: string | number | null, token: string) =>
  grantStreamAccess({
    video,
    viewer: { userId },
    token,
    policy: signedInPolicy,
    appSecret: SECRET,
    nowSeconds: NOW,
  });

/** Вскрывает конверт так же, как это делает загрузчик ключа в плеере. */
function openEnvelope(envelope: string, key: Buffer): Buffer {
  const [iv, sealed, tag] = envelope.split('.') as [string, string, string];
  const decipher = createDecipheriv('aes-128-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(sealed, 'base64url')), decipher.final()]);
}

describe('токен зрителя', () => {
  it('выданный токен читается обратно тем же ключом', () => {
    const token = issueViewerToken(SECRET, NOW);
    const checked = readViewerToken(token.value, SECRET, NOW);
    expect(checked.ok).toBe(true);
    if (checked.ok) expect(checked.key.equals(token.key)).toBe(true);
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

  it('отказ анониму: закрытое требует входа', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const result = await grant(ready, null, token.value);
    expect(result).toMatchObject({ ok: false, reason: 'sign-in-required' });
  });

  it('вошедший получает конверт к закрытому', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const result = await grant(ready, 42, token.value);
    expect(result.ok).toBe(true);
  });

  it('после закрытия отказ тому же зрителю', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const wasOpen = { ...ready, access: 'public' as const };
    expect((await grant(wasOpen, null, token.value)).ok).toBe(true);

    const nowClosed = { ...ready, access: 'private' as const };
    expect(await grant(nowClosed, null, token.value)).toMatchObject({
      ok: false,
      reason: 'sign-in-required',
    });
  });

  it('видео ещё в очереди — конверта нет ни в каком режиме', async () => {
    const token = issueViewerToken(SECRET, NOW);
    const pending: StreamRecord = { ...ready, access: 'public', status: 'pending', secret: null };
    expect(await grant(pending, 42, token.value)).toMatchObject({ ok: false, reason: 'not-ready' });
  });

  it('чужой токен не вскрывает конверт', async () => {
    const mine = issueViewerToken(SECRET, NOW);
    const other = issueViewerToken(SECRET, NOW);
    const result = await grant(ready, 42, mine.value);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(() => openEnvelope(result.envelope, other.key)).toThrow();
    expect(openEnvelope(result.envelope, mine.key).toString('base64')).toBe(ready.secret);
  });

  it('испорченный токен не даёт доступа даже вошедшему', async () => {
    expect(await grant(ready, 42, 'не.токен.вовсе')).toMatchObject({
      ok: false,
      reason: 'bad-token',
    });
  });

  it('право из погашенного кода открывает закрытый видео', async () => {
    // Раньше политика спрашивалась до разбора токена и права из кода не видела:
    // зритель вводил код, а плеер продолжал требовать вход.
    const appSecret = 'секрет-приложения';
    const now = 1_000_000;
    const token = issueViewerToken(appSecret, now, [7]);

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
          // Из токена плейлисты приходят строками — так они туда и записаны.
          return viewer.grantedPlaylists?.map(String).includes('7')
            ? { allowed: true }
            : { allowed: false, reason: 'sign-in-required' };
        },
      },
      appSecret,
      nowSeconds: now,
    });

    expect(result.ok).toBe(true);
  });
});
