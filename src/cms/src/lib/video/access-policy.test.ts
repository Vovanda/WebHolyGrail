import { describe, expect, it } from 'vitest';

import { openOnlyPolicy } from './access-policy.js';

/**
 * Открытая запись обязана оставаться открытой: ограничения существуют ради
 * закрытых, и любое из них, задевшее открытую, ломает обычный просмотр -
 * человек приходит по ссылке и упирается в требование, которого быть не должно.
 */

const openVideo = { id: 1, access: 'public' } as const;
const closedVideo = { id: 2, access: 'private' } as const;

describe('openOnlyPolicy', () => {
  it('открытую запись отдаёт незнакомцу без условий', async () => {
    await expect(openOnlyPolicy.decide(openVideo, { userId: null })).resolves.toEqual({
      allowed: true,
    });
  });

  it('открытую запись отдаёт и обладателю учётной записи', async () => {
    await expect(openOnlyPolicy.decide(openVideo, { userId: 7 })).resolves.toEqual({
      allowed: true,
    });
  });

  it('закрытую не отдаёт и объясняет причину', async () => {
    await expect(openOnlyPolicy.decide(closedVideo, { userId: null })).resolves.toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('учётная запись сама по себе закрытую не открывает', async () => {
    // Регистрации зрителей в шаблоне нет, и вход условием выдачи не бывает:
    // закрытое открывает право, а базовая политика прав не знает вовсе.
    await expect(openOnlyPolicy.decide(closedVideo, { userId: 3 })).resolves.toEqual({
      allowed: false,
      reason: 'not-entitled',
    });
  });

  it('своё автор смотрит без всякого права', async () => {
    // Иначе он публикует вслепую: закрытая запись не откроется даже тому,
    // кто её загрузил.
    await expect(
      openOnlyPolicy.decide(closedVideo, { userId: null, ownsVideo: true }),
    ).resolves.toEqual({ allowed: true });
  });
});
