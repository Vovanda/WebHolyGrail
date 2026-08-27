import { createCipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Конверт: секрет потока, зашифрованный персональным токеном зрителя.
 *
 * @remarks
 * Плееру нужен голый ключ — так устроен формат. Но отдавать его прямо в ответе
 * нельзя: такой ответ сохраняется и работает у кого угодно. Поэтому эндпоинт
 * возвращает конверт, а вскрывает его наш загрузчик в плеере, уже имея токен,
 * выданный этой же сессии при рендере страницы.
 *
 * Токен подписан и содержит срок: сервер ничего не хранит и не помнит — он
 * проверяет подпись и время. Ни таблицы сессий, ни ротации по таймеру.
 */

/** Сколько живёт токен зрителя без прав из кода: дольше сессии он не нужен. */
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

/**
 * Потолок срока токена.
 *
 * @remarks
 * Право из кода живёт свой срок - курс открывают на месяцы, - и токен обязан
 * дожить до его конца, иначе зритель добывал бы новый код каждый вечер.
 *
 * Но и вечным он быть не может: ключ конверта лежит внутри, и токен, забытый
 * на чужом устройстве, остаётся рабочим ровно столько, сколько мы позволим.
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
  /** Строка для передачи в разметку страницы и обратно в эндпоинт. */
  readonly value: string;
  /** Ключ, которым шифруется конверт. В разметку не попадает. */
  readonly key: Buffer;
  /** До какой секунды действует: по нему живёт и кука, хранящая токен. */
  readonly expires: number;
}

/**
 * Наборы, открытые этому токену по коду.
 *
 * @remarks
 * Погашенный код не пишет ничего в базу: он дописывает право прямо в токен и
 * пересобирает подпись. Отсюда простота — нет записи о доступе, нет привязки
 * к браузеру, нечего отзывать: право живёт ровно столько, сколько токен.
 *
 * За деньги так нельзя: покупку надо видеть, продлевать и отзывать, — там
 * право остаётся отдельной записью.
 */
export type GrantedPlaylists = ReadonlyArray<string | number>;

/**
 * Выдаёт токен зрителя.
 *
 * @remarks
 * Ключ шифрования лежит внутри самого токена: сервер не хранит его нигде и
 * восстанавливает при проверке. Это тот случай, когда «без состояния» —
 * не экономия, а требование: инстансов может быть два (blue и green), и
 * хранимая на одном сессия не нашлась бы на другом.
 */
export function issueViewerToken(
  appSecret: string,
  nowSeconds: number,
  granted: GrantedPlaylists = [],
): ViewerToken {
  const key = randomBytes(16);
  const expires = nowSeconds + TOKEN_TTL_SECONDS;
  return { value: buildToken(key, expires, granted, appSecret), key, expires };
}

/**
 * Пересобирает токен с добавленным набором.
 *
 * @remarks
 * Ключ сохраняется: у зрителя уже идёт просмотр, и подмена ключа посреди
 * сеанса оборвала бы воспроизведение.
 *
 * Срок продлевается до конца права: код открывает курс на недели, а токен без
 * продления умирал бы за вечер, и человек шёл бы за новым кодом каждый день.
 * Сокращать срок при этом нельзя - другое право в том же токене живёт дольше.
 */
export function withGrantedPlaylist(
  token: string,
  playlistId: string | number,
  appSecret: string,
  nowSeconds: number,
  grantedUntilSeconds?: number | null,
): string | null {
  const parsed = readViewerToken(token, appSecret, nowSeconds);
  if (!parsed.ok) return null;

  // Сравниваем строками: из токена набор приходит строкой, из базы числом, и
  // прямое сравнение не находило совпадения - повторное погашение того же кода
  // дописывало набор ещё раз, и список рос с каждой попыткой.
  const already = parsed.granted.some((id) => String(id) === String(playlistId));
  const granted = already ? parsed.granted : [...parsed.granted, playlistId];

  const wanted = grantedUntilSeconds ?? parsed.expires;
  const expires = Math.min(Math.max(parsed.expires, wanted), nowSeconds + MAX_TOKEN_TTL_SECONDS);

  return buildToken(parsed.key, expires, granted, appSecret);
}

function buildToken(
  key: Buffer,
  expires: number,
  granted: GrantedPlaylists,
  appSecret: string,
): string {
  // Наборы через запятую внутри одной части: разделитель токена другой,
  // поэтому разбор не ломается даже при пустом списке.
  const payload = `${base64url(key)}${SEPARATOR}${expires}${SEPARATOR}${granted.join(',')}`;
  return `${payload}${SEPARATOR}${sign(payload, appSecret)}`;
}

/** Проверенный токен: ключ конверта или отказ с причиной. */
export type TokenCheck =
  | {
      readonly ok: true;
      readonly key: Buffer;
      readonly expires: number;
      /** Наборы, открытые погашенными кодами. */
      readonly granted: GrantedPlaylists;
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
  if (parts.length !== 4) return { ok: false, reason: 'malformed' };

  const [rawKey, rawExpires, rawGranted, signature] = parts as [string, string, string, string];
  const expected = sign(`${rawKey}${SEPARATOR}${rawExpires}${SEPARATOR}${rawGranted}`, appSecret);

  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return { ok: false, reason: 'signature' };
  }

  const expires = Number(rawExpires);
  if (!Number.isFinite(expires) || expires <= nowSeconds) {
    return { ok: false, reason: 'expired' };
  }

  const key = Buffer.from(rawKey, 'base64url');
  if (key.length !== 16) return { ok: false, reason: 'malformed' };

  const granted = rawGranted ? rawGranted.split(',').filter(Boolean) : [];
  return { ok: true, key, expires, granted };
}

/**
 * Запечатывает секрет потока в конверт для конкретного зрителя.
 *
 * @remarks
 * AES-128-GCM: помимо шифрования он даёт метку подлинности, и подменённый по
 * дороге конверт не вскроется, а не расшифруется в мусор, который плеер будет
 * молча пытаться играть.
 *
 * Вектор кладём в ответ рядом: он не секретный, но обязан быть разным для
 * каждой выдачи — повтор вектора с тем же ключом раскрывает содержимое.
 */
export function sealEnvelope(secret: Buffer, viewerKey: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-128-gcm', viewerKey, iv);
  const sealed = Buffer.concat([cipher.update(secret), cipher.final()]);
  return [base64url(iv), base64url(sealed), base64url(cipher.getAuthTag())].join(SEPARATOR);
}
