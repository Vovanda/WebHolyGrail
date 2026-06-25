/**
 * dog-mentions-rules — порт legacy R1-R5 из `veo55/src/server/dog-mentions.php`.
 *
 * @remarks
 * Логика 1:1 с PHP/JS из legacy. Каскад правил:
 *
 *  - R1: `#ОмскаяДружина <Имя>` → canonical «ОМСКАЯ ДРУЖИНА <ИМЯ>»
 *  - R2: `<Приставка> <Имя>` (любая kennel из {@link KENNELS}, любой регистр)
 *  - R3: `ОД <Имя>` → канон «ОМСКАЯ ДРУЖИНА <ИМЯ>»
 *  - R4: known dogs + aliases (точное вхождение слова, см. {@link KNOWN_DOGS})
 *  - R5: внутри скобок `( X & Y )` — каждая сторона = кандидат
 *
 * Каждый кандидат — потенциальное упоминание собаки. Server-side РКФ-резолв
 * (по `canonical` → `dog_id`) делает legacy; в нашей итерации 1 (MVP) мы
 * полагаемся на R4 (заведомо известные собаки) + R1-R3 даёт стабильный canonical
 * по конструкции «kennel + name», который ведёт на `/catalog?name=<canonical>`.
 *
 * Итерация 2: справочники {@link KENNELS}/{@link KNOWN_DOGS}/{@link STOP_WORDS}
 * редактируются из Payload-global `DogMentionsConfig`; этот модуль начинает
 * принимать конфиг как параметр (см. PLAN #2).
 */

/** Приставки питомников (Title Case). Используются в R2. */
export const KENNELS: readonly string[] = [
  'Омская Дружина',
  'Стиль Белогорья',
  'Бетэльгейзе Лаэрс',
  'Царский Дар',
  'Сиб Гард',
  'Янсонс',
  'Русский Амулет',
  'Рус Вандерленд',
  'Полярная Звезда',
  'Алый Пограничный',
  'Гардемарин Морской',
  'Государственная Граница',
  'Кара Миа',
  'Орлетт Ненаглядная',
  'Имперский Бренд',
  'Зарри Скай',
  'Алтея Сибирская',
];

/** Известные собаки: canonical (UPPER) + aliases для R4. */
export const KNOWN_DOGS: ReadonlyArray<{
  readonly canonical: string;
  readonly aliases?: readonly string[];
}> = [
  { canonical: 'ОМСКАЯ ДРУЖИНА ТУРЕЛЬ', aliases: ['Турель'] },
  {
    canonical: 'ОМСКАЯ ДРУЖИНА НОБЕЛЕВСКАЯ ПРЕМИЯ',
    aliases: ['Нобелевская Премия', 'Нобелевская'],
  },
  { canonical: 'ОМСКАЯ ДРУЖИНА ИМПЕРИАЛ', aliases: ['Империал'] },
  { canonical: 'ОМСКАЯ ДРУЖИНА ИДЕАЛЬНАЯ ТАКТИКА', aliases: ['Идеальная Тактика'] },
  { canonical: 'ОМСКАЯ ДРУЖИНА НОМИНАЦИЯ УСПЕХА', aliases: ['Номинация Успеха'] },
  { canonical: 'ОМСКАЯ ДРУЖИНА ЯБЛОНЯ В ЦВЕТУ', aliases: ['Яблоня в Цвету', 'Яблоня'] },
  { canonical: 'ТУАНЕТТА МАКАРЛЕТ', aliases: ['Туанетта'] },
  { canonical: 'ОРЛЕТТ НЕНАГЛЯДНАЯ', aliases: ['Орлетт'] },
  { canonical: 'БЕТЭЛЬГЕЙЗЕ ЛАЭРС МАРС-АРЭС' },
  { canonical: 'БЕТЭЛЬГЕЙЗЕ ЛАЭРС ЮДАНА' },
  { canonical: 'РУС ВАНДЕРЛЕНД ОМОН' },
  { canonical: 'МОНШЕР ВИРСАЛЬ ЧИНГИСХАН' },
  { canonical: 'ЦАРСКИЙ ДАР НАДЁЖНЫЙ ДРУГ' },
];

const STOP_WORDS_LIST = [
  'юный',
  'юная',
  'юные',
  'юного',
  'юниор',
  'юниоры',
  'чемпион',
  'чемпиона',
  'чемпионы',
  'чемпионка',
  'чемпионат',
  'класс',
  'отлично',
  'хорошо',
  'оценка',
  'лучший',
  'лучшая',
  'лучшее',
  'лучшие',
  'лучшего',
  'большая',
  'большой',
  'малая',
  'малый',
  'гордость',
  'получил',
  'получила',
  'получили',
  'ветеран',
  'ветераны',
  'представитель',
  'выставка',
  'выставки',
  'моно',
  'монопородной',
  'номинация',
  'победитель',
  'тренер',
  'хендлер',
  'заводчик',
  'владелец',
  'эксперт',
  'судья',
  'кинолог',
  'отец',
  'мать',
  'сын',
  'дочь',
  'дочка',
  'брат',
  'сестра',
  'дрессировка',
  'питомник',
  'восточноевропейская',
  'российская',
  'кинологическая',
  'федерация',
];
const STOP_WORDS = new Set(STOP_WORDS_LIST);

const CAPS_ABBR = new Set([
  'ВЕО',
  'САС',
  'КЧК',
  'ЛПП',
  'НКП',
  'РКФ',
  'ОКД',
  'ЗКС',
  'ЮСС',
  'ЮСАС',
  'ЮКЧК',
  'ВКЧК',
  'ВСАС',
  'ВПР',
  'ЧРКФ',
  'ЮЧРКФ',
  'СИБ',
  'НСО',
  'РЖД',
  'ПМЖ',
  'БЭСТ',
  'МООК',
  'ТПИ',
  'ZTP',
  'BH',
  'VT',
  'IPO',
  'ID',
  'РФ',
  'FCI',
]);

const CITIES = new Set([
  'омск',
  'тюмень',
  'сургут',
  'новосибирск',
  'москва',
  'екатеринбург',
  'челябинск',
  'тобольск',
  'курган',
  'барнаул',
  'санкт-петербург',
  'спб',
  'питер',
  'ханты-мансийск',
  'ханты',
  'тверь',
  'красноярск',
  'кемерово',
  'нягань',
]);

const PEOPLE_FIRST = new Set([
  'дарья',
  'андрей',
  'наталья',
  'елена',
  'ольга',
  'александр',
  'екатерина',
  'валентин',
  'драган',
  'альфонсо',
  'мария',
  'ирина',
  'светлана',
  'татьяна',
  'сергей',
  'михаил',
  'алексей',
  'дмитрий',
  'илья',
  'роман',
  'юрий',
  'николай',
  'владимир',
  'павел',
]);

const FUNCTION_WORDS = new Set([
  'в',
  'во',
  'на',
  'по',
  'и',
  'у',
  'с',
  'со',
  'к',
  'ко',
  'от',
  'до',
  'для',
  'без',
  'при',
  'под',
  'над',
  'об',
  'о',
  'за',
  'из',
  'через',
  'а',
  'но',
  'ли',
  'же',
]);

export interface MentionCandidate {
  readonly start: number;
  readonly end: number;
  readonly display: string;
  readonly canonical: string;
  readonly rule: 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
}

/** Ё→Е + UPPER. Используется для canonical имени. */
export function canonical(s: string): string {
  return s.toUpperCase().replace(/Ё/g, 'Е');
}

function isTitleToken(tok: string): boolean {
  return /^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z'-]*$/.test(tok);
}

function isStopToken(tok: string): boolean {
  if (!tok) return true;
  if (/^\d/.test(tok)) return true;
  const lo = tok.toLowerCase();
  return STOP_WORDS.has(lo) || CITIES.has(lo) || PEOPLE_FIRST.has(lo) || CAPS_ABBR.has(tok);
}

/** Маскируем VK [id|name], URLs, attachments — длина сохраняется. */
function maskNoise(raw: string): string {
  return raw
    .replace(/\[(?:id|club|public)\d+\|[^\]]+\]/g, (m) => ' '.repeat(m.length))
    .replace(/https?:\/\/\S+/g, (m) => ' '.repeat(m.length))
    .replace(/\[[a-z]+\d+_\d+\]/g, (m) => ' '.repeat(m.length));
}

/**
 * Greedy чтение имени с позиции `start`. Берёт до `maxTokens` Title-case-токенов,
 * допуская между ними короткие связки («в», «и», «на»). Стоп — на: stop-words,
 * не-TitleCase, переносе строки, начале новой приставки питомника.
 */
function readName(
  text: string,
  start: number,
  maxTokens = 5,
): {
  text: string;
  tokens: string[];
  end: number;
} | null {
  const len = text.length;
  let pos = start;
  const tokens: string[] = [];
  let lastEnd = start;
  let significant = 0;

  while (significant < maxTokens) {
    while (pos < len && (text[pos] === ' ' || text[pos] === '\t')) pos++;
    if (pos >= len) break;
    const ch = text[pos];
    if (ch === '\n' || ch === '\r') break;

    const rest = text.slice(pos, pos + 60);
    const m = /^([А-ЯЁA-Zа-яёa-z][А-ЯЁA-Zа-яёa-z'-]*)/.exec(rest);
    if (!m || !m[1]) break;
    const tok: string = m[1];

    if (/^[А-ЯЁA-Z]/.test(tok)) {
      if (!isTitleToken(tok)) break;
      if (isStopToken(tok)) break;
      significant++;
    } else {
      // Строчное допускаем только короткой связкой, за которой идёт TitleCase
      // и НЕ начинается новая kennel-приставка.
      if (!FUNCTION_WORDS.has(tok.toLowerCase())) break;
      let peek = pos + tok.length;
      while (peek < len && (text[peek] === ' ' || text[peek] === '\t')) peek++;
      if (peek >= len) break;
      const peekCh = text[peek];
      if (!peekCh || !/^[А-ЯЁA-Z]/.test(peekCh)) break;
      const restAfter = text.slice(peek, peek + 50);
      const foundKennel = KENNELS.some((k) => {
        if (restAfter.length < k.length) return false;
        if (restAfter.slice(0, k.length).toLowerCase() !== k.toLowerCase()) return false;
        const next = restAfter.charAt(k.length);
        return next === '' || next === ' ' || next === '\t' || next === '\n';
      });
      if (foundKennel) break;
    }

    tokens.push(tok);
    pos += tok.length;
    lastEnd = pos;
  }

  if (tokens.length === 0) return null;
  return {
    text: text.slice(start, lastEnd).trim(),
    tokens,
    end: lastEnd,
  };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract — каскад R1..R5. См. JSDoc модуля. */
export function extractByRules(raw: string): MentionCandidate[] {
  if (!raw) return [];
  const work = maskNoise(raw);
  const found: MentionCandidate[] = [];

  // R1: #ОмскаяДружина <Имя> — хэштег ОСТАЁТСЯ хэштегом (отдельная VK-ссылка
  // через applyInlineRegex). Подсвечивается ТОЛЬКО имя после него. Legacy
  // news.php / dog-mentions.php делает так же: charStart считается после
  // strlen($matches[0]) хэштега.
  const r1Re =
    /#(?:ОмскаяДружина|омскаядружина|Омская_Дружина|ОмскаяЛружина|ОмсксяДружина|омскадружина|ОМСКАЯДРУЖИНА)/g;
  for (let m: RegExpExecArray | null; (m = r1Re.exec(work)) !== null; ) {
    const full = m[0];
    if (!full) continue;
    let startName = m.index + full.length;
    while (
      startName < work.length &&
      (work[startName] === ' ' || work[startName] === '_' || work[startName] === '\t')
    )
      startName++;
    const n = readName(raw, startName);
    if (n && n.tokens.length >= 1) {
      found.push({
        start: startName,
        end: n.end,
        display: raw.slice(startName, n.end),
        canonical: canonical('ОМСКАЯ ДРУЖИНА ' + n.tokens.join(' ')),
        rule: 'R1',
      });
    }
  }

  // R2: <Приставка> <Имя> (case-insensitive)
  for (const kennel of KENNELS) {
    const re = new RegExp(`(^|[^А-ЯЁA-Zа-яёa-z])(${escapeRegex(kennel)})(?=\\s+[А-ЯЁA-Z])`, 'giu');
    for (let m: RegExpExecArray | null; (m = re.exec(work)) !== null; ) {
      const lead = m[1] ?? '';
      const matched = m[2];
      if (!matched) continue;
      const kennelStart = m.index + lead.length;
      let afterKennel = kennelStart + matched.length;
      while (afterKennel < work.length && (work[afterKennel] === ' ' || work[afterKennel] === '\t'))
        afterKennel++;
      const n = readName(raw, afterKennel);
      if (n && n.tokens.length >= 1) {
        found.push({
          start: kennelStart,
          end: n.end,
          display: raw.slice(kennelStart, n.end),
          canonical: canonical(kennel + ' ' + n.tokens.join(' ')),
          rule: 'R2',
        });
      }
    }
  }

  // R3: ОД <Имя>
  const r3Re = /(^|[^А-ЯЁA-Zа-яёa-z])ОД(?=\s+[А-ЯЁ])/g;
  for (let m: RegExpExecArray | null; (m = r3Re.exec(work)) !== null; ) {
    const odStart = m.index + (m[1]?.length ?? 0);
    let afterOd = odStart + 2;
    while (afterOd < work.length && (work[afterOd] === ' ' || work[afterOd] === '\t')) afterOd++;
    const n = readName(raw, afterOd);
    if (n && n.tokens.length >= 1) {
      found.push({
        start: odStart,
        end: n.end,
        display: raw.slice(odStart, n.end),
        canonical: canonical('ОМСКАЯ ДРУЖИНА ' + n.tokens.join(' ')),
        rule: 'R3',
      });
    }
  }

  // R4: known dogs + aliases (точное вхождение слова)
  for (const dog of KNOWN_DOGS) {
    const forms = [dog.canonical, ...(dog.aliases ?? [])];
    for (const form of forms) {
      const re = new RegExp(
        `(^|[^А-ЯЁA-Zа-яёa-z])(${escapeRegex(form)})(?![А-ЯЁA-Zа-яёa-z])`,
        'giu',
      );
      for (let m: RegExpExecArray | null; (m = re.exec(work)) !== null; ) {
        const matched = m[2];
        if (!matched) continue;
        const s = m.index + (m[1]?.length ?? 0);
        const e = s + matched.length;
        found.push({
          start: s,
          end: e,
          display: raw.slice(s, e),
          canonical: canonical(dog.canonical),
          rule: 'R4',
        });
      }
    }
  }

  // R5: внутри скобок (...) — TitleCase кластеры (2+ токена)
  const r5Outer = /\(([^()]{5,300})\)/g;
  for (let m: RegExpExecArray | null; (m = r5Outer.exec(work)) !== null; ) {
    const contentStart = m.index + 1;
    const content = m[1];
    if (!content) continue;
    const inner = /[А-ЯЁ][А-ЯЁа-яё-]+(?:\s+[А-ЯЁ][А-ЯЁа-яё-]+){1,4}/g;
    for (let im: RegExpExecArray | null; (im = inner.exec(content)) !== null; ) {
      const s = contentStart + im.index;
      const n = readName(raw, s, 5);
      if (n && n.tokens.length >= 2) {
        found.push({
          start: s,
          end: n.end,
          display: raw.slice(s, n.end),
          canonical: canonical(n.tokens.join(' ')),
          rule: 'R5',
        });
      }
    }
  }

  return dedupe(found);
}

/** Пересекающиеся — оставляем более длинный. Сортировка по `start`, при равенстве — длиннее первым. */
function dedupe(found: MentionCandidate[]): MentionCandidate[] {
  const sorted = [...found].sort((a, b) =>
    a.start !== b.start ? a.start - b.start : b.end - a.end - (a.end - a.start),
  );
  const out: MentionCandidate[] = [];
  let lastEnd = -1;
  for (const m of sorted) {
    if (out.length === 0 || m.start >= lastEnd) {
      out.push(m);
      lastEnd = m.end;
      continue;
    }
    const prev = out[out.length - 1];
    if (prev && m.end - m.start > prev.end - prev.start) {
      out[out.length - 1] = m;
      lastEnd = m.end;
    }
  }
  return out;
}
