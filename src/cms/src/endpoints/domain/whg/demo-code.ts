import type { Endpoint } from 'payload';

import { issueDemoCode } from '../../../lib/domain/whg/demo-code';
import { codeExpiry, codeRules, type VideoCodeSettings } from '../../../lib/video/code-rules';

/**
 * Выдача демонстрационного кода - вещь витрины, а не движка.
 *
 * @remarks
 * Лежит в domain, потому что нужна одному сайту: показать, как работает доступ
 * по коду, вместо того чтобы рассказывать о нём словами. Обычному сайту такой
 * генератор не нужен вовсе, и синк эту папку не обходит.
 *
 * Собственный ответ, а не общий помощник из соседнего файла: у витринной ручки
 * своя жизнь, и тянуть за ней внутренности движка незачем.
 */
const noStore = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' };

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: noStore });

/**
 * Выдаёт демонстрационный код на плейлист.
 *
 * @remarks
 * Витрина обязана давать потрогать: иначе про доступ по коду приходится верить
 * на слово. Посетитель нажимает кнопку, получает код и тут же вводит его —
 * и закрытые видео плейлиста открываются у него на глазах.
 *
 * Включается флагом окружения и по умолчанию молчит. В обычном инстансе такой
 * генератор печатал бы посторонним ключи от платного, поэтому это не настройка
 * в админке, которую можно случайно включить, а решение при развёртывании.
 *
 * Код одноразовый и живёт минуты: он нужен ровно на один показ, а не на то,
 * чтобы разойтись по чатам.
 */
export const videoDemoCodeEndpoint: Endpoint = {
  path: '/video/demo-code',
  method: 'post',
  handler: async (req) => {
    const playlistId = process.env['DEMO_CODE_PLAYLIST'];
    if (!playlistId) return json({ error: 'disabled' }, 404);

    /*
      Срок и длина берутся оттуда же, откуда у обычных кодов, - из настроек
      сайта. Витрина показывает ровно то, что получит владелец у себя, а не
      своё отдельное число.

      Переменная среды остаётся перекрытием: на показе бывает нужен код
      подольше, чем в жизни.
    */
    const settings = (await req.payload.findGlobal({ slug: 'site-settings', depth: 0 })) as {
      video?: VideoCodeSettings;
    };
    const asked = process.env['DEMO_CODE_TTL_MINUTES'];
    const rules = codeRules({
      ...settings.video,
      ...(asked ? { codeTtlMinutes: Number(asked) } : {}),
    });
    const expiresAt = codeExpiry(rules, new Date());

    const { code } = await issueDemoCode({
      payload: req.payload,
      playlistId: Number(playlistId),
      length: rules.length,
      expiresAt,
      grantMinutes: 15,
    });

    return json({ code, expiresAt });
  },
};
