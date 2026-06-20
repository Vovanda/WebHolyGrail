/**
 * RKF parser — TS-порт `dog-helpers.php` из legacy veo55.
 *
 * @remarks
 * Парсит карточку собаки с РКФ-каталога `veorkf.ru/catalog/dog.php?screen=1&id=N`:
 *  - имя (рус + латиница в скобках)
 *  - info[] (TD_N/TD_A пары: окрас, пол, дата рождения, № родословной, …)
 *  - father / mother — relations со ссылками на dog.php?id=N
 *  - extra fields (Дрессировка / Заводчик / Владелец / Место рождения / Импорт / Экспорт)
 *  - **Питомник** — выделяется из Заводчика по паттерну `питомник «...»`
 *  - photos[] — HEAD-перебор `showphoto.php?id=N&n=0..9` пока не nopic-md5
 *  - pedigree[] — массив 14 предков (heap-layout, см. JSDoc DogDoc.pedigree)
 *
 * РКФ отдаёт HTML в CP1251, декодируем через `iconv-lite`.
 *
 * Server-only. НЕ импортить из client.
 */
import iconv from 'iconv-lite';

import { cached } from './cache';

export interface RkfAncestor {
  /**
   * Позиция в heap-layout (1..14). 0 — это сама собака, дальше:
   *  1 — отец, 2 — его отец (дед), 3 — прадед, 4 — прабабка,
   *  5 — бабка по отцу, 6 — прадед, 7 — прабабка,
   *  8 — мать, 9 — её отец, 10 — прадед, ..., 14 — прабабка.
   */
  position: number;
  /** РКФ-id предка (для кросс-ссылок). */
  rkfId?: number;
  /** Имя как в РКФ (uppercase). */
  name: string;
  /** Заметка — обычно «{окрас}, {год}». */
  note?: string;
}

export interface RkfPhoto {
  url: string;
  n: number;
  /** Авторы — приходят из HTML РКФ через индекс n. */
  author?: string;
}

export interface RkfInfoField {
  label: string;
  value: string;
}

export interface RkfRelation {
  id: number;
  name: string;
}

export interface RkfDogDto {
  id: number;
  name: string;
  nameLat: string;
  photos: RkfPhoto[];
  info: RkfInfoField[];
  father?: RkfRelation;
  mother?: RkfRelation;
  pedigree: RkfAncestor[];
}

const UA = 'Mozilla/5.0 (compatible; veo55-cms-rkf-parser/1.0)';
const RKF_BASE = 'https://www.veorkf.ru/catalog';

/** Fetch с РКФ + декод CP1251 → UTF-8. */
async function rkfFetch(url: string, timeoutMs = 20_000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return '';
    const buf = await res.arrayBuffer();
    return iconv.decode(Buffer.from(buf), 'win1251');
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

/** Нормализация HTML-фрагмента → чистый текст (порт `veo_clean`). */
function clean(s: string): string {
  return s
    .replace(/<br\s*\/?>/gi, ' ')
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

interface NopicCacheEntry {
  md5: string;
  fetchedAt: number;
}
let nopicCache: NopicCacheEntry | null = null;

/** MD5 заглушки nopic.jpg РКФ — фильтруем фото, чьё тело идентично заглушке. */
async function getNopicMd5(): Promise<string> {
  if (nopicCache && Date.now() - nopicCache.fetchedAt < 24 * 3600 * 1000) {
    return nopicCache.md5;
  }
  try {
    const res = await fetch(`${RKF_BASE}/img/nopic.jpg`, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return '';
    const buf = await res.arrayBuffer();
    const md5 = await md5Hex(Buffer.from(buf));
    nopicCache = { md5, fetchedAt: Date.now() };
    return md5;
  } catch {
    return '';
  }
}

async function md5Hex(buf: Buffer): Promise<string> {
  const { createHash } = await import('node:crypto');
  return createHash('md5').update(buf).digest('hex');
}

/**
 * Реальный перебор фото — параллельные HEAD-запросы. РКФ-нумерация плотная:
 * первый «пусто / nopic» останавливает дальнейшие запросы.
 */
async function findPhotos(id: number, maxN = 10, size = 640): Promise<RkfPhoto[]> {
  const nopicMd5 = await getNopicMd5();
  // Параллельно тянем превью size=80 для определения «есть/нет». URL для
  // финального возврата собираем под size=640 (или переданный).
  const results = await Promise.all(Array.from({ length: maxN }, (_, n) => fetchPhotoSize(id, n)));
  const found: RkfPhoto[] = [];
  for (let n = 0; n < maxN; n++) {
    const r = results[n];
    if (!r) break;
    const isPhoto = r.ok && r.len > 1000 && (nopicMd5 === '' || r.md5 !== nopicMd5);
    if (!isPhoto) break; // первый «пусто» останавливает
    found.push({
      url: `${RKF_BASE}/showphoto.php?id=${id}&n=${n}&s=${size}`,
      n,
    });
  }
  return found;
}

async function fetchPhotoSize(
  id: number,
  n: number,
): Promise<{ ok: boolean; len: number; md5: string } | null> {
  try {
    const res = await fetch(`${RKF_BASE}/showphoto.php?id=${id}&n=${n}&s=80`, {
      headers: { 'User-Agent': UA },
    });
    if (!res.ok) return { ok: false, len: 0, md5: '' };
    const buf = await res.arrayBuffer();
    const len = buf.byteLength;
    const md5 = len > 0 ? await md5Hex(Buffer.from(buf)) : '';
    return { ok: true, len, md5 };
  } catch {
    return null;
  }
}

/** Сырой парсинг — без кеша. */
async function parseDogRaw(id: number): Promise<RkfDogDto | null> {
  const html = await rkfFetch(`${RKF_BASE}/dog.php?screen=1&id=${id}`);
  if (!html) return null;

  // --- Имя (рус + латиница) ---
  let name = '';
  let nameLat = '';
  const nameMatch = html.match(/FONT-SIZE:\s*24px[^>]*>(.*?)<\/DIV>/is);
  if (nameMatch) {
    const full = clean(nameMatch[1] ?? '');
    const latMatch = full.match(/^(.*?)\s*\((.*?)\)\s*$/u);
    if (latMatch) {
      name = (latMatch[1] ?? '').trim();
      nameLat = (latMatch[2] ?? '').trim();
    } else {
      name = full;
    }
  }
  if (!name) {
    const titleMatch = html.match(/<title>(.*?)<\/title>/is);
    if (titleMatch) {
      const title = clean(titleMatch[1] ?? '')
        .replace(/^Восточноевропейская овчарка\s*-\s*/u, '')
        .replace(/\s*ID:.*$/u, '');
      name = title.trim();
    }
  }

  // --- info, father, mother ---
  const info: RkfInfoField[] = [];
  let father: RkfRelation | undefined;
  let mother: RkfRelation | undefined;
  const trRegex = /class=TD_N[^>]*>(.*?)<\/TD>\s*<TD[^>]*class=TD_A[^>]*>(.*?)<\/TD>/gis;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const label = clean(trMatch[1] ?? '').replace(/:$/, '');
    const rawVal = trMatch[2] ?? '';
    const value = clean(rawVal);
    if (!label || !value) continue;

    const linkMatch = rawVal.match(/dog\.php\?[^']*id=(\d+)/i);
    if (linkMatch) {
      const rel: RkfRelation = { id: Number(linkMatch[1]), name: value };
      if (label.toLowerCase().includes('отец')) {
        father = rel;
        continue;
      }
      if (label.toLowerCase().includes('мать')) {
        mother = rel;
        continue;
      }
    }
    info.push({ label, value });
  }

  // --- Доп-поля (Дрессировка, Заводчик, Владелец, …) ---
  const wantExtra = [
    'Дрессировка',
    'Заводчик',
    'Владелец',
    'Место рождения',
    'Импорт из',
    'Экспорт в',
  ];
  for (const lbl of wantExtra) {
    const labelPat = new RegExp(
      `<font[^>]*color\\s*=\\s*["']?#686868["']?[^>]*>\\s*${escapeRegex(lbl)}[:\\s]*<\\/font>`,
      'isu',
    );
    const lm = labelPat.exec(html);
    if (!lm) continue;
    const afterPos = lm.index + lm[0].length;
    const chunk = html.slice(afterPos, afterPos + 1500);
    const valMatch = chunk.match(
      /<font[^>]*color\s*=\s*["']?Black["']?[^>]*>\s*<b>(.*?)<\/b>\s*<\/font>/isu,
    );
    if (!valMatch) continue;
    let val = clean(valMatch[1] ?? '');
    if (!val) continue;

    if (lbl === 'Заводчик' || lbl === 'Владелец') {
      // Питомник «...» — отдельным полем, до обрезки val
      if (lbl === 'Заводчик') {
        const kennelMatch = val.match(/питомник\s*[«"'""]([^«»"'""]+)[»"'""]/u);
        if (kennelMatch) {
          info.push({ label: 'Питомник', value: (kennelMatch[1] ?? '').trim() });
        }
      }
      // Берём только «Фамилия И.», «Фамилия И. О.»
      const nm = val.match(
        /^([\p{Lu}][\p{Ll}]+(?:[-\s][\p{Lu}][\p{Ll}]+)?\s+[\p{Lu}]\.(?:\s*[\p{Lu}]\.)?)/u,
      );
      if (nm) {
        val = (nm[1] ?? '').trim();
      } else {
        const parts = val.split(',');
        val = (parts[0] ?? '').trim();
      }
    }
    info.push({ label: lbl, value: val });
  }

  // Переименование «Потомков в базе» → «Потомков в базе РКФ»
  for (const f of info) {
    if (f.label.toLowerCase().includes('потомков в базе')) {
      f.label = 'Потомков в базе РКФ';
    }
  }

  // --- Photos (реальный HEAD-перебор) ---
  const photos = await findPhotos(id);

  // --- Авторы фото из HTML РКФ ---
  const authorRegex = new RegExp(`showphoto\\.php\\?id=${id}&(?:amp;)?n=(\\d+)`, 'gi');
  const authors = new Map<number, string>();
  let authorMatch: RegExpExecArray | null;
  while ((authorMatch = authorRegex.exec(html)) !== null) {
    const n = Number(authorMatch[1]);
    if (authors.has(n)) continue;
    const afterPos = authorMatch.index + authorMatch[0].length;
    const chunk = html.slice(afterPos, afterPos + 600);
    const authMatch = chunk.match(/Автор\s+фотографии:\s*([^<\n]+)/u);
    if (authMatch) {
      authors.set(n, (authMatch[1] ?? '').trim());
    }
  }
  for (const p of photos) {
    const a = authors.get(p.n);
    if (a) p.author = a;
  }

  // --- Pedigree (heap-layout до 14 позиций) ---
  // РКФ в `dog.php?screen=1&id=N` отдаёт секцию «РОДОСЛОВНАЯ» с предками в
  // фиксированном порядке: [собака, отец, дед_отц, прадед_1, прабабка_1,
  // бабка_отц, прадед_2, прабабка_2, мать, дед_мат, прадед_3, прабабка_3,
  // бабка_мат, прадед_4, прабабка_4]. Это `position` 0..14. UI рендерит
  // позиции 1..14 (0 — сама собака, в дереве не показывается).
  const pedStart = html.indexOf('РОДОСЛОВНАЯ');
  const pedHtml = pedStart >= 0 ? html.slice(pedStart) : html;
  const ped: RkfAncestor[] = [];
  const seen = new Set<number>();
  const pedRegex =
    /<A\b[^>]*?dog\.php\?[\s\S]*?id=(\d+)[\s\S]*?>([^<>]+)<\/A>([\s\S]*?)(?=<A\b|<\/td>|<\/tr>)/gi;
  let pedMatch: RegExpExecArray | null;
  let position = 0;
  while ((pedMatch = pedRegex.exec(pedHtml)) !== null) {
    const aid = Number(pedMatch[1]);
    const an = clean(pedMatch[2] ?? '');
    const extra = clean(pedMatch[3] ?? '');
    if (!an || seen.has(aid)) continue;
    seen.add(aid);
    ped.push({
      position,
      rkfId: aid,
      name: an,
      ...(extra ? { note: extra } : {}),
    });
    position++;
  }

  return {
    id,
    name,
    nameLat,
    photos,
    info,
    father,
    mother,
    pedigree: ped,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Парсинг собаки по РКФ-id с кешем (7 дней hard, 1 день soft).
 *
 * @example
 *   const dog = await parseDog(65923);
 *   // → { id: 65923, name: 'БЕТЭЛЬГЕЙЗЕ ЛАЭРС МАРС-АРЭС', photos: [...], info: [...], pedigree: [...] }
 */
export async function parseDog(id: number): Promise<RkfDogDto | null> {
  if (!Number.isFinite(id) || id < 1) return null;
  return cached(`rkf:dog:${id}`, { hardTtlSec: 7 * 86400, softTtlSec: 86400 }, () =>
    parseDogRaw(id),
  );
}
