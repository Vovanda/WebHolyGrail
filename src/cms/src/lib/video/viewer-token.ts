import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Токен зрителя: подписанная строка со сроком и идентичностью.
 *
 * @remarks
 * Токен носит идентичность, а не права: права лежат записями и находятся по нему.
 * Поэтому выданное отзывается, а сам токен остаётся у зрителя рабочим - он
 * просто перестаёт что-либо открывать.
 *
 * Сервер ничего не хранит и не помнит: проверяет подпись и время. Это не
 * экономия на таблице сессий, а требование выкладки - при смене цвета работают
 * два процесса разом, и сессия, запомненная одним, у другого не нашлась бы.
 *
 * Формат свой, не JWT: `срок.идентичность.подпись` на HMAC-SHA256. Разбирает его
 * тот же сервер, который выдал, поэтому заголовок с алгоритмом и разбор JSON
 * не нужны.
 */

/** Частей в токене: срок, идентичность, подпись. */
const PARTS = 3;

/** Сколько живёт токен зрителя без прав из кода: дольше сессии он не нужен. */
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

/**
 * Потолок срока токена.
 *
 * @remarks
 * Право из кода живёт свой срок - курс открывают на месяцы, - и токен обязан
 * дожить до его конца, иначе зритель добывал бы новый код каждый вечер.
 *
 * Но и вечным он быть не может: токен, забытый на чужом устройстве, открывает
 * ровно столько, сколько мы позволим.
 */
const MAX_TOKEN_TTL_SECONDS = 400 * 24 * 60 * 60;

/** Разделитель частей токена: полезная часть и подпись. */
const SEPARATOR = '.';

const base64url = (input: Buffer): string => input.toString('base64url');

/**
 * Подпись токена.
 *
 * @remarks
 * Ключ подписи — тот же секрет приложения, что и у остальной авторизации:
 * заводить отдельный означало бы ещё одну переменную окружения, которую забудут
 * задать при разворачивании инстанса.
 */
function sign(payload: string, appSecret: string): string {
  return base64url(createHmac('sha256', appSecret).update(payload).digest());
}

export interface ViewerToken {
  /** Строка, которая уходит в куку зрителя. */
  readonly value: string;
  /** До какой секунды действует: по нему живёт и кука, хранящая токен. */
  readonly expires: number;
  /** Идентичность зрителя: по нему находятся его права. */
  readonly visitorMarker: VisitorMarker;
}

/**
 * Идентичность зрителя, которому выдан токен.
 *
 * @remarks
 * Токен носит идентичность, а не права. Права лежат записями и находятся по этому
 * опознанию - так же, как права вошедшего находятся по его учётной записи.
 *
 * Раньше погашенный код дописывал подборку прямо в токен и записи не оставлял.
 * Отозвать такое право было нельзя ни при каком желании: сервер о нём не знал.
 * Отсюда и перемена - отзыв обязан работать одинаково для всех.
 *
 * Идентичность случайно и выдаётся при первой встрече. Личности за ним нет: это
 * не имя человека, а имя его доступа.
 */
export type VisitorMarker = string;

/**
 * Выдаёт токен зрителя.
 *
 * @remarks
 * Идентичность случайно и выдаётся при первой встрече: сервер о зрителе ничего
 * не знает, пока тот не погасит код.
 */
export function issueViewerToken(
  appSecret: string,
  nowSeconds: number,
  visitorMarker: VisitorMarker = base64url(randomBytes(12)),
): ViewerToken {
  const expires = nowSeconds + TOKEN_TTL_SECONDS;
  return { value: buildToken(expires, visitorMarker, appSecret), expires, visitorMarker };
}

/**
 * Продлевает токен до конца выданного права.
 *
 * @remarks
 * Права токен не носит - они записаны отдельно. Но жить он обязан не меньше,
 * чем открытое право: код открывает курс на недели, а токен без продления
 * умирал бы за вечер, и человек шёл бы за новым кодом каждый день.
 *
 * Идентичность сохраняется: смена его отрезала бы зрителя от собственных прав.
 *
 * Сокращать срок нельзя - другое право того же зрителя живёт дольше.
 */
export function withExtendedLife(
  token: string,
  appSecret: string,
  nowSeconds: number,
  grantedUntilSeconds?: number | null,
): string | null {
  const parsed = readViewerToken(token, appSecret, nowSeconds);
  if (!parsed.ok) return null;

  const wanted = grantedUntilSeconds ?? parsed.expires;
  const expires = Math.min(Math.max(parsed.expires, wanted), nowSeconds + MAX_TOKEN_TTL_SECONDS);

  return buildToken(expires, parsed.visitorMarker, appSecret);
}

function buildToken(expires: number, visitorMarker: VisitorMarker, appSecret: string): string {
  const payload = `${expires}${SEPARATOR}${visitorMarker}`;
  return `${payload}${SEPARATOR}${sign(payload, appSecret)}`;
}

/** Проверенный токен: срок с идентичностью или отказ с причиной. */
export type TokenCheck =
  | {
      readonly ok: true;
      readonly expires: number;
      /** Идентичность, по которому находятся права этого зрителя. */
      readonly visitorMarker: VisitorMarker;
    }
  | { readonly ok: false; readonly reason: 'malformed' | 'signature' | 'expired' };

/**
 * Разбирает токен зрителя.
 *
 * @remarks
 * Подпись сверяется сравнением за постоянное время: обычное сравнение строк
 * выходит из цикла на первом несовпавшем байте, и по времени ответа подпись
 * подбирается посимвольно.
 */
export function readViewerToken(token: string, appSecret: string, nowSeconds: number): TokenCheck {
  const parts = token.split(SEPARATOR);
  if (parts.length !== PARTS) return { ok: false, reason: 'malformed' };

  const [rawExpires, rawMarker, signature] = parts as [string, string, string];
  const expected = sign(`${rawExpires}${SEPARATOR}${rawMarker}`, appSecret);

  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return { ok: false, reason: 'signature' };
  }

  const expires = Number(rawExpires);
  if (!Number.isFinite(expires) || expires <= nowSeconds) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, expires, visitorMarker: rawMarker };
}
