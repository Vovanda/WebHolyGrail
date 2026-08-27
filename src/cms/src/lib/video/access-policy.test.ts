import { describe, expect, it } from 'vitest';

import { signedInPolicy } from './access-policy.js';

/**
 * Открытая запись обязана оставаться открытой: ограничения существуют ради
 * закрытых, и любое из них, задевшее открытую, ломает обычный просмотр -
 * человек приходит по ссылке и упирается в требование, которого быть не должно.
 */

const openVideo = { id: 1, access: 'public' } as const;
const closedVideo = { id: 2, access: 'private' } as const;

describe('signedInPolicy', () => {
  it('открытую запись отдаёт незнакомцу без условий', async () => {
    await expect(signedInPolicy.decide(openVideo, { userId: null })).resolves.toEqual({
      allowed: true,
    });
  });

  it('открытую запись отдаёт и вошедшему', async () => {
    await expect(signedInPolicy.decide(openVideo, { userId: 7 })).resolves.toEqual({
      allowed: true,
    });
  });

  it('закрытую незнакомцу не отдаёт и объясняет причину', async () => {
    await expect(signedInPolicy.decide(closedVideo, { userId: null })).resolves.toEqual({
      allowed: false,
      reason: 'sign-in-required',
    });
  });

  it('закрытую отдаёт вошедшему', async () => {
    await expect(signedInPolicy.decide(closedVideo, { userId: 3 })).resolves.toEqual({
      allowed: true,
    });
  });

  it('право автора базовая политика не разбирает: этим занимается действующая', async () => {
    await expect(
      signedInPolicy.decide(closedVideo, { userId: null, ownsVideo: true }),
    ).resolves.toEqual({ allowed: false, reason: 'sign-in-required' });
  });
});
