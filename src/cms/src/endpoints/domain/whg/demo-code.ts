import type { Endpoint } from 'payload';

import { generateAccessCode } from '../../lib/video/access-code';
import { codeExpiry, codeRules, type VideoCodeSettings } from '../../lib/video/code-rules';

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

    /*
      Выданный код всегда начинает с чистого листа.

      Символов в коде немного, и рано или поздно тот же плейлист символов выпадет
      снова. Если бы при этом сохранялась прежняя история срабатываний,
      человек получил бы рабочий на вид код и отказ «уже использован» — при
      том, что этот ключ выдан ему только что.

      Поэтому видео с таким кодом переписывается: новый плейлист, новый срок,
      счётчик обнулён. Заодно это не плодит видео на каждое нажатие кнопки.
    */
    const code = generateAccessCode(rules.length);
    const data = {
      code,
      playlist: Number(playlistId),
      // Одно срабатывание: код выдан этому посетителю и на один показ.
      maxUses: 1,
      usedCount: 0,
      expiresAt,
      /*
        Демо открывает подборку на время просмотра, а не на сутки. Иначе витрина
        перестаёт быть витриной: посетитель вернулся показать коллеге - замков
        уже нет, и рассказывать про закрытый доступ не на чем.
      */
      grantMinutes: 15,
      grantDays: null,
    };

    const clash = await req.payload.find({
      collection: 'access-codes',
      where: { code: { equals: code } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });

    const previous = clash.docs[0] as { id: string | number } | undefined;
    if (previous) {
      await req.payload.update({
        collection: 'access-codes',
        id: previous.id,
        data,
        overrideAccess: true,
      });
    } else {
      await req.payload.create({ collection: 'access-codes', data, overrideAccess: true });
    }

    return json({ code, expiresAt });
  },
};
