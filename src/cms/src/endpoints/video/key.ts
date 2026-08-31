/**
 * Ключ к потоку: выдача на криптопериод.
 */
import type { Endpoint } from 'payload';
import { keyForPeriod } from '../../lib/video/crypto-period';
import { payloadEntitlements } from '../../lib/video/entitlement-source';
import { entitlementPolicy } from '../../lib/video/entitlements';
import { grantStreamAccess, type StreamRecord } from '../../lib/video/grant-access';
import { checkKeyRateShared } from '../../lib/video/key-rate-store';
import { masterKey, unwrapSecret } from '../../lib/video/key-vault';
import { checkRequestOrigin } from '../../lib/video/request-origin';
import { noteKeyRequest } from '../../lib/video/shared-access';
import {
  allowedOrigins,
  appSecret,
  clientKey,
  json,
  nowSeconds,
  tokenFromCookie,
  viewerOf,
} from './shared';
/**
 * Отдаёт ключ криптопериода.
 *
 * @remarks
 * Отказ возвращается кодом 403 с причиной, а не пустым телом: плееру нужно
 * отличать «войди» от «видео ещё готовится», чтобы показать нужную заглушку
 * вместо чёрного квадрата.
 */
export const videoKeyEndpoint: Endpoint = {
  path: '/video/:id/key',
  method: 'get',
  handler: async (req) => {
    const id = req.routeParams?.['id'];
    if (!id) return json({ error: 'Не указан видео.' }, 400);

    /*
      Ключ выдаём плееру на нашем сайте. Чужая страница, встроившая поток,
      получает отказ: платный курс не должен крутиться на стороннем сайте под
      чужой рекламой.

      От выкачивания это не защищает - заголовки подделываются, - и такой
      случай ловится частотой запросов.
    */
    const origin = checkRequestOrigin(req.headers, allowedOrigins());
    if (!origin.allowed) return json({ error: 'foreign-origin' }, 403);

    /*
      Ключ у записи не один: она поделена на криптопериоды, и у каждого свой
      ключ, выведенный из секрета. Плеер просит ключ того периода, к которому
      подошёл, - номер стоит в адресе.

      Длина периода берётся у записи, а не из настройки: настройку владелец
      меняет когда угодно, и деление на новое значение дало бы другие границы -
      уже нарезанное перестало бы играть. Пусто - запись нарезана до появления
      криптопериодов, у неё единственный ключ на всю длину.
    */
    const asked = new URL(req.url ?? '', 'http://localhost').searchParams.get('p');
    const period = asked === null ? null : Number(asked);
    if (period !== null && (!Number.isInteger(period) || period < 0)) {
      return json({ error: 'bad-period' }, 400);
    }

    /*
      Зритель просит ключ раз в несколько минут, скачиватель - десятками подряд.
      Считаем темп по разным ключам: страница держит плеер в блоке, в тексте
      и в подборке, все просят один и тот же - повтор запаса не тратит.
    */
    const rate = await checkKeyRateShared(
      req.payload,
      clientKey(req),
      `${String(id)}:${asked ?? '-'}`,
    );
    if (!rate.allowed) {
      return new Response(JSON.stringify({ error: 'too-many-keys' }), {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(rate.retryAfterSeconds),
        },
      });
    }

    // Токен приходит кукой, а не параметром адреса: в адресе он оседал бы
    // в логах прокси и в заголовке перехода, а кука закрыта от скриптов.
    const token = tokenFromCookie(req) ?? '';

    const doc = (await req.payload.findByID({
      collection: 'media',
      id: String(id),
      depth: 0,
      // Секрет закрыт для чтения через API — здесь он нужен по существу,
      // поэтому берём его в обход доступа и наружу не отдаём.
      overrideAccess: true,
    })) as {
      id: string | number;
      access?: string;
      uploadedBy?: unknown;
      hls?: {
        status?: string;
        secret?: string | null;
        cryptoPeriod?: number | null;
        deletedAt?: string | null;
      };
    };

    // Помеченный к удалению не играет: файлы ещё лежат, и без этой проверки
    // прямая ссылка продолжала бы показывать то, что владелец убрал.
    if (doc.hls?.deletedAt) return json({ error: 'not-found' }, 404);

    // Секрет лежит в базе завёрнутым в мастер-ключ — разворачиваем перед тем,
    // как отдать его зрителю. Видео, залитые до включения ключа,
    // читаются как есть.
    const stored = doc.hls?.secret ?? null;

    // Криптопериоды у записи есть - значит запрос обязан назвать номер, и наоборот.
    // Несовпадение означает либо старый плеер на новой записи, либо попытку
    // получить корневой секрет, и в обоих случаях отвечать нечем.
    const split = typeof doc.hls?.cryptoPeriod === 'number' && doc.hls.cryptoPeriod >= 1;
    let picked: Buffer | null = null;
    if (stored) {
      const choice = keyForPeriod(unwrapSecret(stored, masterKey()), period, split);
      if (!choice.ok) return json({ error: choice.reason }, 400);
      picked = choice.key;
    }

    const video: StreamRecord = {
      id: doc.id,
      access: doc.access === 'private' ? 'private' : 'public',
      status: (doc.hls?.status as StreamRecord['status']) ?? 'pending',
      secret: picked ? picked.toString('base64') : null,
    };

    const result = await grantStreamAccess({
      video,
      viewer: viewerOf(req, doc.uploadedBy),
      token,
      policy: entitlementPolicy(payloadEntitlements(req.payload)),
      appSecret: appSecret(),
      nowSeconds: nowSeconds(),
    });

    if (!result.ok) {
      const status = result.reason === 'not-ready' ? 409 : 403;
      return json({ error: result.reason }, status);
    }

    /*
      Ключ выдан - отмечаем обращение. Под одним правом видны отдельные линии:
      у каждой свой клиент и своё место в записи. Один человек даёт две-три
      (телефон рядом с компьютером, вторая вкладка), десять - уже складчина.

      Отказом не отвечаем: обрывать доступ на лишней линии значит наказывать
      за обычное поведение. Владельцу это видно в журнале, решение - за ним.
    */
    const sharing = noteKeyRequest(
      String(viewerOf(req, doc.uploadedBy).visitorMarker ?? req.user?.id ?? clientKey(req)),
      clientKey(req),
      period ?? 0,
    );
    if (sharing.shared || sharing.apart) {
      const tail = sharing.lines % 10;
      const teen = sharing.lines % 100 >= 11 && sharing.lines % 100 <= 14;
      const word =
        !teen && tail === 1 ? 'линия' : !teen && tail >= 2 && tail <= 4 ? 'линии' : 'линий';
      req.payload.logger.warn(
        `[video] запись ${doc.id}: под одним доступом ${sharing.lines} ${word}` +
          (sharing.apart ? ', и они смотрят разные места записи' : ''),
      );
    }

    /*
      Ключ уходит шестнадцатью байтами, а не строкой в JSON: так его забирает
      штатный загрузчик плеера по адресу из манифеста, и своего кода для этого
      не нужно вовсе.

      Кешировать нечего и нельзя: ответ зависит от того, кто спрашивает.
    */
    return new Response(Buffer.from(result.key, 'base64'), {
      status: 200,
      headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/octet-stream' },
    });
  },
};
