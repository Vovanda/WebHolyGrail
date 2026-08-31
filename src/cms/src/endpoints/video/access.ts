/**
 * Доступ: право зрителя, погашение кода и ссылки, выдача токена.
 */
import type { Endpoint } from 'payload';
import { acceptLink } from '../../lib/video/accept-link';
import { normalizeAccessCode } from '../../lib/video/access-code';
import { accessContents, payloadEntitlements } from '../../lib/video/entitlement-source';
import { entitlementPolicy } from '../../lib/video/entitlements';
import { looksLikeLinkToken } from '../../lib/video/link-token';
import { redeemCode } from '../../lib/video/redeem';
import {
  checkRedeemAttempt,
  forgetRedeemMisses,
  noteRedeemMiss,
} from '../../lib/video/redeem-throttle';
import { resourceAddress } from '../../lib/video/resource-address';
import { issueViewerToken, readViewerToken, withExtendedLife } from '../../lib/video/viewer-token';
import { writeEntitlement } from '../../lib/video/write-entitlement';
import {
  appSecret,
  clientKey,
  json,
  jsonWithToken,
  nowSeconds,
  tokenFromCookie,
  viewerOf,
} from './shared';
export const videoAccessEndpoint: Endpoint = {
  path: '/video/:id/access',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан видео.' }, 400);

    const doc = (await req.payload.findByID({
      collection: 'media',
      id: String(id),
      depth: 0,
      overrideAccess: true,
    })) as {
      id: string | number;
      access?: string;
      uploadedBy?: unknown;
      hls?: { status?: string; deletedAt?: string | null };
    };

    if (doc.hls?.deletedAt) {
      return json({ allowed: false, reason: 'not-found', status: 'deleted' });
    }

    const decision = await entitlementPolicy(payloadEntitlements(req.payload)).decide(
      { id: doc.id, access: doc.access === 'private' ? 'private' : 'public' },
      viewerOf(req, doc.uploadedBy),
    );

    return json({
      allowed: decision.allowed,
      reason: decision.allowed ? null : decision.reason,
      status: doc.hls?.status ?? 'pending',
    });
  },
};

/**
 * Погашает код доступа.
 *
 * @remarks
 * Код не хранит доступ, а выдаёт его: сработав, он превращается в обычную
 * запись права - на учётную запись, если зритель вошёл, и на его идентичность,
 * если нет. Отозвать такое право можно у любого, и держится оно не токеном.
 *
 * В ответе всё же новый токен: он продлён до конца выданного права, иначе
 * человек добывал бы код заново каждый вечер. Идентичность и ключ шифрования
 * внутри сохраняются прежними - подмена ключа посреди сеанса оборвала бы
 * идущий просмотр, а подмена идентичности отрезала бы зрителя от только что
 * записанного права.
 */
export const videoRedeemEndpoint: Endpoint = {
  path: '/video/redeem',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { code?: string } | undefined;
    const raw = String(body?.code ?? '');
    if (!raw) return json({ error: 'Не указан код.' }, 400);

    // Идентичность приходит кукой. У того, кто вводит код впервые, её ещё нет:
    // заводим тут же, иначе право не на кого записать.
    const token = tokenFromCookie(req) ?? issueViewerToken(appSecret(), nowSeconds()).value;

    // Приводим к виду выдачи: человек диктует и переписывает с ошибками ровно
    // там, где символы похожи.
    const code = normalizeAccessCode(raw);
    if (!code) return json({ error: 'not-found' }, 404);

    /*
      Подбор кода отсекаем по адресу обратившегося: шесть символов машина
      перебирает за часы, а живой человек ошибается два-три раза подряд.

      Ответ при этом тот же, что и на неверный код: по разнице между «не тот
      код» и «слишком часто» перебор понимал бы, что нащупал верный.
    */
    const client = clientKey(req);
    const attempt = checkRedeemAttempt(client);
    if (!attempt.allowed) {
      return new Response(JSON.stringify({ error: 'invalid' }), {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(attempt.retryAfterSeconds),
        },
      });
    }

    const found = await req.payload.find({
      collection: 'media-access-codes',
      where: { code: { equals: code } },
      depth: 0,
      limit: 1,
      overrideAccess: true,
    });

    const doc = found.docs[0] as
      | {
          id: string | number;
          access?: string | number | { id?: string | number } | null;
          revoked?: boolean | null;
          maxUses?: number | null;
          usedCount?: number | null;
          expiresAt?: string | null;
          grantDays?: number | null;
          grantMinutes?: number | null;
        }
      | undefined;

    // С глубиной ноль в связи лежит номер, с большей - сам документ.
    const accessId =
      typeof doc?.access === 'object' && doc.access !== null ? doc.access.id : doc?.access;

    const result = redeemCode({
      code:
        doc && accessId !== undefined && accessId !== null
          ? {
              id: doc.id,
              accessId,
              revoked: doc.revoked === true,
              maxUses: doc.maxUses ?? null,
              usedCount: doc.usedCount ?? 0,
              expiresAt: doc.expiresAt ?? null,
              grantDays: doc.grantDays ?? null,
              grantMinutes: doc.grantMinutes ?? null,
            }
          : null,
      viewerId: req.user?.id ?? null,
      now: new Date(),
    });

    if (!result.ok) {
      // Наружу одна причина на все случаи «код не сработал»: разные ответы
      // подсказывали бы перебору, какой код существует, какой просрочен, а
      // какой израсходован.
      noteRedeemMiss(client);
      return json({ error: 'invalid' }, 403);
    }

    // Код подошёл - счёт промахов обнуляется: человек, ошибшийся пару раз,
    // дальше работает без задержек.
    forgetRedeemMisses(client);

    /*
      Токен продлеваем до конца выданного права: код открывает курс на недели,
      а токен без продления умирал бы за вечер, и человек шёл бы за новым кодом
      каждый день. Само право в токен не кладётся - оно записывается ниже.
    */
    const grantedUntil = result.expiresAt
      ? Math.floor(new Date(result.expiresAt).getTime() / 1000)
      : null;
    const next = withExtendedLife(token, appSecret(), nowSeconds(), grantedUntil);
    // Токен просрочен или испорчен: идентичности в нём нет, записать право не на
    // что. Погашение засчитывать при этом нечестно — код должен остаться рабочим.
    if (!next) return json({ error: 'bad-token' }, 403);

    const checked = readViewerToken(next, appSecret(), nowSeconds());
    if (!checked.ok) return json({ error: 'bad-token' }, 403);

    // Счётчик срабатываний растёт только после того, как право реально выдано.
    await req.payload.update({
      collection: 'media-access-codes',
      id: doc!.id,
      data: { usedCount: (doc!.usedCount ?? 0) + 1 },
      overrideAccess: true,
    });

    /*
      Право записывается всегда - и вошедшему, и тому, кто учётной записи
      не заводил. Разница только в том, чем оно держится: у первого учётной
      записью, у второго идентичностью из токена.

      Записью, а не пометкой в токене: пока право жило в токене, снять его было
      нельзя - сервер о нём не знал вовсе.
    */
    await writeEntitlement({
      payload: req.payload,
      // Всё, что известно о человеке сразу: право у него одно, и найтись оно
      // должно по любому признаку - иначе вошедший заведёт себе второе.
      holder: { userId: req.user?.id, visitorMarker: checked.visitorMarker },
      target: { accessId: result.accessId },
      grantedUntil: result.expiresAt ?? null,
      source: 'promo',
      sourceRef: code,
      note: `Код ${code}`,
    });

    /*
      Продлённый токен запоминается браузером: без этого идентичность сменится
      на следующей же перезагрузке, и записанное право не найдётся.

      В ответе - состав доступа: страница снимает замки по нему. Одного адреса
      мало, доступ покрывает и подборки, и отдельные записи разом.
    */
    const opened = await accessContents(req.payload, result.accessId);

    return jsonWithToken(
      { token: next, accessId: result.accessId, granted: opened },
      next,
      checked.expires,
    );
  },
};

/**
 * Выдаёт токен зрителя.
 *
 * @remarks
 * Открыт для всех, включая не вошедших: сам по себе токен ничего не открывает,
 * он лишь опознаёт того, кто пришёл. Право смотреть проверяется
 * отдельно, при выдаче ключа.
 */
export const videoTokenEndpoint: Endpoint = {
  path: '/video/token',
  method: 'post',
  handler: (req) => {
    // Уже выданный токен важнее нового: в нём идентичность, по которому находятся
    // права зрителя, и свежий токен отрезал бы его от них.
    const saved = tokenFromCookie(req);
    if (saved) {
      const checked = readViewerToken(saved, appSecret(), nowSeconds());
      if (checked.ok) return json({ token: saved });
    }

    const token = issueViewerToken(appSecret(), nowSeconds());
    // Наружу уходит только идентичность со сроком и подписью: ключей в токене
    // нет, за ними приходят отдельно и по одному.
    return jsonWithToken({ token: token.value }, token.value, token.expires);
  },
};

/**
 * Принимает ссылку-приглашение.
 *
 * @remarks
 * Отдельно от погашения кода, потому что и предмет другой, и защита. Код
 * шестизначный, и его прикрывает задержка после промахов: перебор иначе
 * нащупал бы верный за часы. Адрес ссылки перебирать бессмысленно — в нём
 * около ста тридцати бит, — зато сам адрес расходится по чатам, поэтому у него
 * есть отзыв и обязательный срок.
 *
 * Как и код, ссылка не хранит доступ, а выдаёт его: сработав, она превращается
 * в обычную запись права. Токен в ответе продлён до конца выданного права —
 * идентичность и ключ шифрования внутри остаются прежними, иначе оборвался бы
 * идущий просмотр.
 */
export const videoRedeemLinkEndpoint: Endpoint = {
  path: '/video/redeem-link',
  method: 'post',
  handler: async (req) => {
    const body = (await req.json?.()) as { link?: string } | undefined;
    const address = String(body?.link ?? '').trim();
    if (!address) return json({ error: 'Не указана ссылка.' }, 400);

    // Как и у кода: идентичность приходит кукой, а у пришедшего по ссылке впервые
    // её нет - заводим на месте.
    const token = tokenFromCookie(req) ?? issueViewerToken(appSecret(), nowSeconds()).value;

    // Очевидно чужой адрес отсекаем без похода в базу: длина и алфавит у нашего
    // свои, и на них приходится всё, что можно проверить дёшево.
    if (!looksLikeLinkToken(address)) return json({ error: 'invalid' }, 404);

    /*
      Токен зрителя читаем до погашения: в нём идентичность, на которое ляжет право.
      Испорченный или просроченный означает, что записывать право не на что, -
      и ссылку при этом не тратим, она должна остаться рабочей.
    */
    const checked = readViewerToken(token, appSecret(), nowSeconds());
    if (!checked.ok) return json({ error: 'bad-token' }, 403);

    const result = await acceptLink({
      payload: req.payload,
      token: address,
      holder: { userId: req.user?.id, visitorMarker: checked.visitorMarker },
      now: new Date(),
    });

    if (!result.ok) {
      /*
        Наружу две разные причины, а не одна: отозванную и просроченную ссылку
        человек получил от знакомого и должен понять, что просить новую. Скрывать
        тут нечего - подобрать адрес всё равно нельзя, а «не сработало» без
        объяснения отправило бы его жаловаться выдавшему.
      */
      const status = result.reason === 'not-found' ? 404 : 403;
      return json({ error: result.reason }, status);
    }

    /*
      Токен продлеваем до конца выданного права: ссылка открывает подборку
      на недели, а токен без продления умер бы за вечер. Идентичность и ключ
      внутри сохраняются прежними.
    */
    const grantedUntil = result.grantedUntil
      ? Math.floor(new Date(result.grantedUntil).getTime() / 1000)
      : null;
    const next = withExtendedLife(token, appSecret(), nowSeconds(), grantedUntil);
    if (!next) return json({ error: 'bad-token' }, 403);

    // Срок берём у продлённого токена, а если его прочесть не удалось -
    // у прежнего: ответ должен уйти с честной датой, а не с пустой.
    const refreshed = readViewerToken(next, appSecret(), nowSeconds());

    /*
      Вместе с правом отдаём адрес: тот, кто нажал ссылку, ждёт содержимого,
      а не сообщения об успехе. Право живёт номерами, страница адресуется
      каналом и коротким кодом, поэтому адрес ищется отдельно - и может
      не найтись у только что залитого, тогда ведём на канал целиком.
    */
    const opened = await accessContents(req.payload, result.accessId);
    const first = opened[0];
    const target = first ? await resourceAddress(req.payload, first) : null;

    return jsonWithToken(
      { token: next, accessId: result.accessId, granted: opened, address: target },
      next,
      refreshed.ok ? refreshed.expires : checked.expires,
    );
  },
};
