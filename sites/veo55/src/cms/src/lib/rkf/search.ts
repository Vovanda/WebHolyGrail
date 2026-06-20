/**
 * RKF search — TS-порт `dog-search.php` + `veo_search_dogs_page_fetch` из legacy.
 *
 * @remarks
 * РКФ-поиск собак по кличке — `veorkf.ru/catalog/search.php?name=X&page=N`.
 *
 * **Сессионная пагинация:** РКФ хранит query в сессии и при page>1 без `name=`
 * подхватывает его из cookie. Поэтому для page>1 нужно сначала постучаться на
 * page=1 с правильным cookie-jar, потом последовательно листать. На каждый
 * (name, page) — отдельный кешированный результат.
 *
 * **CP1251:** name URL-encode'им в Windows-1251 (РКФ не UTF-8).
 * **Кеш:** 7 дней hard, 1 день soft (см. `cache.ts`).
 *
 * Server-only (Node).
 */
import iconv from 'iconv-lite';

import { cached } from './cache';

const UA = 'Mozilla/5.0 (compatible; veo55-cms-rkf-search/1.0)';
const RKF_SEARCH_BASE = 'https://www.veorkf.ru/catalog';

export interface RkfSearchItem {
  /** РКФ-id собаки (для ссылок на /catalog?dog=N). */
  id: number;
  /** Кличка как в РКФ. */
  name: string;
  /** Строка из второй колонки таблицы РКФ — обычно «{окрас}, {год}» или «{год}». */
  birth?: string;
}

export interface RkfSearchPage {
  items: RkfSearchItem[];
  /** Есть ли страница с большим номером (РКФ session-based, точное число pages не знаем). */
  hasMore: boolean;
}

/** Нормализация: ё→е (РКФ индексирует без ё). */
function normalizeName(name: string): string {
  return name.replace(/ё/g, 'е').replace(/Ё/g, 'Е').trim();
}

/** UrlEncode в CP1251 для query-string РКФ. */
function urlEncodeCp1251(s: string): string {
  const buf = iconv.encode(s, 'win1251');
  let out = '';
  for (const byte of buf) {
    // RFC 3986 unreserved chars: A-Z a-z 0-9 - _ . ~
    if (
      (byte >= 0x30 && byte <= 0x39) || // 0-9
      (byte >= 0x41 && byte <= 0x5a) || // A-Z
      (byte >= 0x61 && byte <= 0x7a) || // a-z
      byte === 0x2d ||
      byte === 0x5f ||
      byte === 0x2e ||
      byte === 0x7e
    ) {
      out += String.fromCharCode(byte);
    } else {
      out += '%' + byte.toString(16).padStart(2, '0').toUpperCase();
    }
  }
  return out;
}

/**
 * Парсит cookies из Set-Cookie header в "name=value; name2=value2" формат.
 * Упрощённо — берём только name=value, без path/expires/etc.
 */
function parseCookies(setCookieHeaders: string[]): string {
  const cookies = new Map<string, string>();
  for (const sc of setCookieHeaders) {
    const eq = sc.indexOf('=');
    const semi = sc.indexOf(';');
    if (eq < 0) continue;
    const name = sc.slice(0, eq).trim();
    const value = sc.slice(eq + 1, semi > 0 ? semi : undefined).trim();
    cookies.set(name, value);
  }
  return Array.from(cookies.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/** Fetch с РКФ + декод CP1251 + сохранение cookies. */
async function rkfFetch(
  url: string,
  cookie: string | undefined,
  timeoutMs = 20_000,
): Promise<{ html: string; setCookies: string[] }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers: Record<string, string> = { 'User-Agent': UA };
    if (cookie) headers.Cookie = cookie;
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return { html: '', setCookies: [] };
    const buf = await res.arrayBuffer();
    const html = iconv.decode(Buffer.from(buf), 'win1251');
    // Node fetch — `getSetCookie()` возвращает массив. Если нет — пустой.
    const setCookies =
      typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie ===
      'function'
        ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : [];
    return { html, setCookies };
  } catch {
    return { html: '', setCookies: [] };
  } finally {
    clearTimeout(timer);
  }
}

function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/gu, ' ')
    .trim();
}

/** Проверка наличия next page (есть ли в HTML ссылка `search.php?page=N`). */
function hasNextPage(html: string): boolean {
  if (!html) return false;
  return /search\.php\?page=\d+/i.test(html);
}

/** Парсит TR-rows из HTML страницы поиска РКФ → массив items. */
function parseSearchRows(html: string): RkfSearchItem[] {
  const items: RkfSearchItem[] = [];
  const seen = new Set<number>();
  if (!html) return items;
  const trRegex = /<TR[^>]*>([\s\S]*?)<\/TR>/gi;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const tr = trMatch[1] ?? '';
    if (!tr.includes('dog.php?screen')) continue;
    const idMatch = tr.match(/dog\.php\?screen=1&id=(\d+)/i);
    if (!idMatch) continue;
    const id = Number(idMatch[1]);
    if (seen.has(id)) continue;
    seen.add(id);

    // Cells
    const cells: string[] = [];
    const tdRegex = /<TD[^>]*>([\s\S]*?)<\/TD>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(tr)) !== null) {
      cells.push(cleanText(tdMatch[1] ?? ''));
    }

    let nameRaw = '';
    const nm = tr.match(/<A[^>]*dog\.php[^>]*>([^<]+)<\/A>/i);
    if (nm) {
      nameRaw = cleanText(nm[1] ?? '');
    }
    items.push({
      id,
      name: nameRaw || cells[0] || '',
      birth: cells[1],
    });
  }
  return items;
}

async function searchPageFetch(name: string, page: number): Promise<RkfSearchPage> {
  const q = urlEncodeCp1251(name);
  const base = `${RKF_SEARCH_BASE}/search.php?name=${q}&Kennel=0&Color=0&Sex=0&Rkf=&Tavro=&Country=0&owner=&db1=&db2=&ordby=0`;

  // page=1 — стартовый запрос (создаёт РКФ-сессию)
  const first = await rkfFetch(base, undefined);
  const page1Items = parseSearchRows(first.html);

  if (page === 1) {
    return {
      items: page1Items,
      hasMore: hasNextPage(first.html),
    };
  }

  // page>1 — листаем под cookie сессии
  const cookie = parseCookies(first.setCookies);
  let items: RkfSearchItem[] = [];
  let more = false;
  for (let p = 2; p <= page; p++) {
    const url = `${RKF_SEARCH_BASE}/search.php?page=${p}`;
    const r = await rkfFetch(url, cookie);
    items = parseSearchRows(r.html);
    more = hasNextPage(r.html);
    if (items.length === 0) break;
  }
  return { items, hasMore: more };
}

/**
 * Поиск собак на РКФ по имени. Возвращает одну страницу (~40 items) с признаком `hasMore`.
 *
 * @example
 *   const r = await searchDogs('БЕТЭЛЬГЕЙЗЕ', 1);
 *   // → { items: [{id, name, birth}, …], hasMore: true }
 */
export async function searchDogs(name: string, page = 1): Promise<RkfSearchPage> {
  const n = normalizeName(name);
  if (n.length < 2) return { items: [], hasMore: false };
  const p = Math.max(1, Math.floor(page));
  const key = `rkf:search:${n.toLowerCase()}:p${p}`;
  const result = await cached(key, { hardTtlSec: 7 * 86400, softTtlSec: 86400 }, () =>
    searchPageFetch(n, p),
  );
  return result ?? { items: [], hasMore: false };
}
