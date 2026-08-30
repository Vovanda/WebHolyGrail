#!/usr/bin/env node
/**
 * Работа с планом работ: где я, что дальше, что нарушено.
 *
 * @remarks
 * План лежит в KDL и правится руками - это осознанно: правки разнородные,
 * и под каждую заводить команду означало бы получить утилиту, мимо которой
 * половина операций всё равно пойдёт.
 *
 * Утилита закрывает другое - то, что руками делается неверно и молча:
 *
 *   - переносы маркера, где три действия должны случиться разом;
 *   - инварианты, которые синтаксически валидны и потому не видны;
 *   - выдачу очереди человеческим счётом, когда id непрозрачные.
 *
 * Ничего не чинится само. Автопочинка вида «поставлю since сам» уничтожает
 * сигнал: перестаёт быть видно, что маркер переносят неправильно.
 *
 * Лежит рядом с навыком `whg-plan`, который описывает сам формат.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PLAN = process.env['PLAN_FILE'] ?? '.claude/session-context/plan.kdl';

/** Узел плана в том виде, в каком его удобно спрашивать. */
class Node {
  constructor(line, indent, kind, id, title, attrs) {
    this.line = line;
    this.indent = indent;
    this.kind = kind;
    this.id = id;
    this.title = title;
    this.attrs = attrs;
    this.fields = { why: null, how: null, done_when: null };
    this.notes = [];
    this.checks = [];
  }

  get now() {
    return this.attrs['now'] === 'true';
  }
  get done() {
    return this.attrs['done'] === 'true';
  }
  get dropped() {
    return 'dropped' in this.attrs;
  }
  get blocked() {
    return 'blocked' in this.attrs;
  }
  /** В очередь не попадают тупики и закрытое: они уже не работа. */
  get pending() {
    return !this.done && !this.dropped;
  }
}

const HEAD = /^(\s*)(stage|step)\s+(\S+)\s+"([^"]*)"(.*)$/;
const FIELD = /^\s*(why|how|done_when|note|check)\s+"/;

/**
 * Значение поля целиком - в том числе перенесённое на следующие строки.
 *
 * @remarks
 * Длинные заметки разбиты по строкам ради ширины окна, и закрывающая кавычка
 * стоит через две-три строки после открывающей. Разбор по одной строке такое
 * значение не видит вовсе, а вместе с ним пропадает и сам пункт из проверок:
 * заметок ноль - значит «расписали дальнее» молчит, и дальнее спокойно
 * расписывается. В плане на сотню полей так терялось три четверти.
 *
 * Кавычек внутри значений нет, поэтому границу держит первая закрывающая.
 */
function readField(lines, from) {
  const open = lines[from].indexOf('"');
  let value = lines[from].slice(open + 1);
  let last = from;
  while (!value.includes('"')) {
    last += 1;
    if (last >= lines.length) return null;
    value += ' ' + lines[last].trim();
  }
  const end = value.indexOf('"');
  return { value: value.slice(0, end), tail: value.slice(end + 1), last };
}

/** Конец узла - строка перед следующим узлом того же или меньшего отступа. */
function endLine(node, nodes) {
  const after = nodes.find((n) => n.line > node.line && n.indent <= node.indent);
  return after ? after.line - 1 : Number.POSITIVE_INFINITY;
}

/**
 * Лежит ли пункт внутри этого этапа.
 *
 * @remarks
 * Этап, внутри которого стоит маркер, выше маркера не считается: он не забытая
 * работа, а рамка вокруг текущей.
 */
function wraps(node, target, nodes) {
  return node.line < target.line && endLine(node, nodes) >= target.line;
}

/** Значения атрибутов: `done=true`, `since="..."`, `blocked="причина"`. */
function parseAttrs(tail) {
  const attrs = {};
  for (const m of tail.matchAll(/(\w+)=(?:"([^"]*)"|(\S+))/g)) {
    attrs[m[1]] = (m[2] ?? m[3] ?? '').replace(/\{$/, '').trim();
  }
  return attrs;
}

function parse(text) {
  const lines = text.split('\n');
  const nodes = [];
  let current = null;

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const head = HEAD.exec(raw);
    if (head) {
      current = new Node(i + 1, head[1].length, head[2], head[3], head[4], parseAttrs(head[5]));
      nodes.push(current);
      continue;
    }
    const opens = current && FIELD.exec(raw);
    if (!opens) continue;

    const field = readField(lines, i);
    if (!field) continue;
    const name = opens[1];
    if (name === 'note') current.notes.push(field.value);
    else if (name === 'check')
      current.checks.push({ text: field.value, ...parseAttrs(field.tail) });
    else current.fields[name] = field.value;
    i = field.last;
  }

  return { lines, nodes };
}

/**
 * Инварианты плана.
 *
 * @remarks
 * Синтаксически они валидны - файл с ними разбирается и выглядит целым.
 * Именно поэтому их не замечают глазами: нарушение видно только сверкой.
 */
function invariants(nodes) {
  const bad = [];
  const say = (node, text) => bad.push({ line: node?.line ?? 0, id: node?.id ?? '-', text });

  const marked = nodes.filter((n) => n.now);
  if (marked.length === 0) say(null, 'маркера нет вовсе: непонятно, чем занят');
  if (marked.length > 1) {
    say(
      null,
      `маркеров ${marked.length}, а должен быть один: ${marked.map((n) => n.id).join(', ')}`,
    );
  }

  for (const node of nodes) {
    if (node.now && !node.attrs['since']) {
      say(node, 'взят в работу, но нет since - заход не посчитается');
    }
    if (node.done && !node.attrs['at']) say(node, 'закрыт без at');
    if (
      node.done &&
      node.attrs['at'] &&
      node.attrs['since'] &&
      node.attrs['at'] < node.attrs['since']
    ) {
      say(node, `at (${node.attrs['at']}) раньше since (${node.attrs['since']})`);
    }
    if (node.kind === 'step' && node.attrs['state']) {
      say(node, 'state у шага: состояний пять, словами их не заменяют');
    }
    if (!node.now && node.notes.length > 0 && node.pending) {
      say(node, `свободных заметок ${node.notes.length} у не-текущего пункта: расписали дальнее`);
    }
    for (const check of node.checks) {
      if (check['ok'] === 'false') {
        say(node, `проверка не прошла и не заведён пункт-починка: «${check.text.slice(0, 40)}»`);
      }
    }
  }

  /*
    Порядок в документе и есть приоритет, поэтому незакрытое выше маркера читается
    как сделанное - и о нём забывают. Это свойство последовательности, а не узла:
    каждый пункт по отдельности безупречен, врёт их порядок. Отсюда и слепота -
    файл разбирается, инварианты держатся, а половина работы невидима.
  */
  const at = nodes.findIndex((n) => n.now);
  if (at > 0) {
    const above = nodes.slice(0, at).filter((n) => n.pending && !wraps(n, nodes[at], nodes));
    if (above.length) {
      const named = above
        .slice(0, 5)
        .map((n) => n.id + ':' + n.line)
        .join(', ');
      say(
        null,
        'выше маркера незакрытых пунктов ' +
          above.length +
          ' (' +
          named +
          (above.length > 5 ? ', ...' : '') +
          ') - они читаются как сделанные',
      );
    }
  }
  return bad;
}

const minutesSince = (stamp) => {
  const then = Date.parse(stamp.replace(' ', 'T'));
  if (Number.isNaN(then)) return null;
  return Math.round((Date.now() - then) / 60000);
};

const forHuman = (minutes) =>
  minutes === null ? '' : minutes < 90 ? `${minutes} мин` : `${Math.round(minutes / 60)} ч`;

/** Где я: текущий пункт целиком, следующие счётом, нарушения рядом. */
function where(nodes, tail = 6) {
  const out = [];
  const queue = nodes.filter((n) => n.pending);
  const at = queue.findIndex((n) => n.now);
  const current = at >= 0 ? queue[at] : null;

  if (!current) {
    out.push('СЕЙЧАС  маркера нет - взять пункт: node scripts/plan.mjs take <слаг>');
  } else {
    const spent = current.attrs['since']
      ? forHuman(minutesSince(current.attrs['since']))
      : 'без since';
    out.push(`СЕЙЧАС  1. ${current.title}   [${current.id}]   в работе ${spent}`);
    for (const [name, label] of [
      ['why', 'зачем'],
      ['how', 'как'],
      ['done_when', 'готово'],
    ]) {
      if (current.fields[name]) out.push(`        ${label.padEnd(7)} ${current.fields[name]}`);
      else out.push(`        ${label.padEnd(7)} - НЕ ЗАПОЛНЕНО`);
    }
    for (const note of current.notes) out.push(`        . ${note}`);
    for (const check of current.checks) {
      const mark = check['ok'] === 'true' ? '[v]' : check['ok'] === 'false' ? '[X]' : '[ ]';
      out.push(`        ${mark} ${check.text}${check['got'] ? ` -> ${check['got']}` : ''}`);
    }
    if (current.attrs['issue']) out.push(`        задача  ${current.attrs['issue']}`);
  }

  const above = current ? queue.slice(0, at).filter((n) => !wraps(n, current, nodes)) : [];
  if (above.length) {
    out.push('', 'ВЫШЕ МАРКЕРА - незакрыто, а по порядку читается как сделанное');
    for (const node of above) {
      out.push('        ! ' + node.title + '   [' + node.id + ']   строка ' + node.line);
    }
  }

  const next = queue.slice(at + 1, at + 1 + tail);
  if (next.length) {
    out.push('', 'ДАЛЬШЕ');
    next.forEach((node, i) => {
      const flag = node.blocked ? `  (стоит: ${node.attrs['blocked']})` : '';
      out.push(`        ${i + 2}. ${node.title}   [${node.id}]${flag}`);
    });
  }

  const bad = invariants(nodes);
  if (bad.length) {
    out.push('', `НАРУШЕНИЙ ${bad.length} - подробно: node scripts/plan.mjs check`);
  }
  return out.join('\n');
}

function check(nodes) {
  const bad = invariants(nodes);
  if (!bad.length) return { text: 'Инварианты плана держатся.', code: 0 };
  const text = bad
    .map((b) => `  строка ${String(b.line).padStart(4)}  [${b.id}]  ${b.text}`)
    .join('\n');
  return { text: `Нарушений: ${bad.length}\n${text}`, code: 1 };
}

const stamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Правит строку заголовка узла: снимает атрибуты и дописывает свои. */
function rewriteHead(line, { drop = [], set = {} }) {
  const head = HEAD.exec(line);
  if (!head) return line;
  let tail = head[5];
  for (const name of drop) tail = tail.replace(new RegExp(`\\s*${name}=(?:"[^"]*"|\\S+)`), '');
  const brace = tail.includes('{');
  tail = tail.replace('{', '').trimEnd();
  for (const [name, value] of Object.entries(set)) tail += ` ${name}="${value}"`;
  return `${head[1]}${head[2]} ${head[3]} "${head[4]}"${tail}${brace ? ' {' : ''}`;
}

function take(parsed, slug) {
  const target = parsed.nodes.find((n) => n.id === slug);
  if (!target) return { text: `Пункта [${slug}] в плане нет.`, code: 1 };
  if (target.done || target.dropped)
    return { text: `Пункт [${slug}] закрыт или отброшен.`, code: 1 };

  const now = stamp();
  for (const node of parsed.nodes) {
    if (node.now && node.id !== slug) {
      parsed.lines[node.line - 1] = rewriteHead(parsed.lines[node.line - 1], { drop: ['now'] });
    }
  }
  // since переставляется при каждом взятии: пункт, побывавший blocked,
  // иначе показал бы блокировку как работу.
  parsed.lines[target.line - 1] = rewriteHead(parsed.lines[target.line - 1], {
    drop: ['now', 'since'],
    set: { now: 'true', since: now },
  }).replace('now="true"', 'now=true');
  return { text: `Взят [${slug}] — ${target.title}\nsince=${now}`, code: 0, write: true };
}

function done(parsed, slug) {
  const target = parsed.nodes.find((n) => n.id === slug);
  if (!target) return { text: `Пункта [${slug}] в плане нет.`, code: 1 };
  if (!target.fields.done_when) {
    return {
      text: `У [${slug}] нет done_when - закрывать нечем: непонятно, что считалось готовым.`,
      code: 1,
    };
  }
  const open = target.checks.filter((c) => !c['ok']);
  if (open.length) {
    return {
      text:
        `У [${slug}] непройденных проверок: ${open.length}\n` +
        open.map((c) => `  [ ] ${c.text}`).join('\n'),
      code: 1,
    };
  }
  const now = stamp();
  parsed.lines[target.line - 1] = rewriteHead(parsed.lines[target.line - 1], {
    drop: ['now'],
    set: { at: now },
  }).replace(/(\s)(done="true")/, '$1done=true');
  if (!target.done) {
    parsed.lines[target.line - 1] = parsed.lines[target.line - 1].replace(
      `"${target.title}"`,
      `"${target.title}" done=true`,
    );
  }
  return { text: `Закрыт [${slug}] — ${target.title}\nat=${now}`, code: 0, write: true };
}

function add(parsed, slug, title, where_, anchor) {
  if (parsed.nodes.some((n) => n.id === slug))
    return { text: `Слаг [${slug}] уже занят.`, code: 1 };
  const at = parsed.nodes.find((n) => n.id === anchor);
  if (!at) return { text: `Соседа [${anchor}] в плане нет.`, code: 1 };

  const pad = ' '.repeat(at.indent);
  const block = [
    `${pad}step ${slug} "${title}" {`,
    `${pad}    why ""`,
    `${pad}    how ""`,
    `${pad}    done_when ""`,
    `${pad}}`,
  ];

  let insertAt = at.line - 1;
  if (where_ === 'after') {
    // конец узла-соседа: считаем скобки от его заголовка
    let depth = 0;
    let i = at.line - 1;
    do {
      depth +=
        (parsed.lines[i].match(/\{/g) ?? []).length - (parsed.lines[i].match(/\}/g) ?? []).length;
      i += 1;
    } while (i < parsed.lines.length && depth > 0);
    insertAt = i;
  }
  parsed.lines.splice(insertAt, 0, ...block, '');
  return {
    text: `Заведён [${slug}] ${where_ === 'after' ? 'после' : 'перед'} [${anchor}].\nЗаполни why / how / done_when - без них пункт не закрыть.`,
    code: 0,
    write: true,
  };
}

const [, , command = 'where', ...rest] = process.argv;
const file = resolve(PLAN);
const parsed = parse(readFileSync(file, 'utf8'));

let result;
switch (command) {
  case 'where':
    result = { text: where(parsed.nodes, Number(rest[0] ?? 6)), code: 0 };
    break;
  case 'check':
    result = check(parsed.nodes);
    break;
  case 'take':
    result = take(parsed, rest[0]);
    break;
  case 'done':
    result = done(parsed, rest[0]);
    break;
  case 'add': {
    const [slug, title, position, anchor] = rest;
    const where_ = position === '--after' ? 'after' : 'before';
    result = add(parsed, slug, title, where_, anchor);
    break;
  }
  default:
    result = {
      text: [
        'node scripts/plan.mjs [команда]',
        '',
        '  where [N]                       где я: текущий пункт целиком и N следующих (по умолчанию 6)',
        '  check                           инварианты узлов и порядка; код возврата 1, если нарушены',
        '  take <слаг>                     взять в работу: снять прежний маркер, поставить since',
        '  done <слаг>                     закрыть: at, с проверкой done_when и непройденных check',
        '  add <слаг> "<название>" --before|--after <слаг>   завести пункт в разрыв',
        '',
        'Файл плана: PLAN_FILE, по умолчанию .claude/session-context/plan.kdl',
      ].join('\n'),
      code: 1,
    };
}

if (result.write) writeFileSync(file, parsed.lines.join('\n'), 'utf8');
process.stdout.write(result.text + '\n');
process.exit(result.code);
