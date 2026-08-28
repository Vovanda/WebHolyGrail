#!/usr/bin/env node
/**
 * sync-template — обновить инстанс Holy Grail из template (WHG).
 *
 * Usage:
 *   node scripts/sync-template.mjs <instance-path> [--ref main|<branch>|<tag>|<sha>]
 *                                                  [--repo <path-or-url>]
 *                                                  [--dry-run] [--include-claude]
 *
 * Почему Node, а не rsync: rsync нет в Git Bash на Windows и его установка —
 * отдельный квест (msys2/scoop/WSL). Node в проекте есть по определению, значит
 * скрипт работает из коробки на любой машине, где вообще собирается WHG.
 *
 * Что делает:
 *   1. Источник — локальный путь (default: сам WHG) или git clone по --repo.
 *   2. Mirror-whitelist: generic-код копируется в инстанс, устаревшие файлы
 *      внутри этих путей удаляются (аналог `rsync --delete`).
 *   3. Overlay-whitelist: обновляет существующее, но НЕ удаляет то, что
 *      downstream добавил сам (docs, skills).
 *   4. Пишет `.template-version` с sha источника.
 *
 * Чего НЕ трогает: `blocks/domain/`, `payload.config.ts`, `contracts/src/index.ts`,
 * `migrations/`, `site.config.ts`, `.env*`, `.infisical.json` — там merge-зона
 * или instance-owned контент.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { REGISTRY, classify, readRegistry } from './lib/zones.mjs';

// ─── Аргументы ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let instanceArg = '';
let ref = 'main';
let repo = '';
let dryRun = false;
let includeClaude = false;
let force = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--ref') ref = args[++i];
  else if (arg === '--repo') repo = args[++i];
  else if (arg === '--dry-run') dryRun = true;
  else if (arg === '--force') force = true;
  else if (arg === '--include-claude') includeClaude = true;
  else if (arg === '--help' || arg === '-h') {
    console.log(readHelp());
    process.exit(0);
  } else if (arg.startsWith('-')) {
    fail(`Unknown flag: ${arg}`);
  } else if (!instanceArg) instanceArg = arg;
  else fail(`Unexpected arg: ${arg}`);
}

if (!instanceArg) {
  fail(
    'ERROR: instance path required\n  node scripts/sync-template.mjs <instance-path> [--ref <ref>] [--repo <path-or-url>]',
  );
}

const INSTANCE = path.resolve(instanceArg);
if (!fs.existsSync(path.join(INSTANCE, '.git'))) {
  fail(`ERROR: ${INSTANCE} is not a git repo`);
}

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

// ─── Источник ──────────────────────────────────────────────────────────

const isUrl = /^(https?:\/\/|git@)/.test(repo) || /^[\w-]+\/[\w-]+$/.test(repo);
let sourceDir;
let cleanupSource = false;

if (!repo) {
  sourceDir = path.resolve(SCRIPT_DIR, '..');
} else if (isUrl) {
  const url = /^[\w-]+\/[\w-]+$/.test(repo) ? `git@github.com:${repo}.git` : repo;
  sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whg-sync-'));
  console.log(`→ Clone ${url} @ ${ref}`);
  git(['clone', '--depth=1', '-b', ref, url, sourceDir], process.cwd());
  cleanupSource = true;
} else {
  sourceDir = path.resolve(repo);
  if (fs.existsSync(path.join(sourceDir, '.git'))) {
    const current = git(['rev-parse', '--abbrev-ref', 'HEAD'], sourceDir).trim();
    if (ref !== current) {
      console.log(`→ git checkout ${ref} in ${sourceDir}`);
      git(['fetch', '--quiet'], sourceDir);
      git(['checkout', ref, '--quiet'], sourceDir);
    }
  }
}

const sourceSha = safeGit(['rev-parse', '--short', 'HEAD'], sourceDir) ?? 'unknown';
console.log(`→ Source: ${sourceDir} @ ${ref} (${sourceSha})`);
console.log(`→ Target: ${INSTANCE}`);

// ─── Зоны ──────────────────────────────────────────────────────────────

/*
  Зоны берутся из реестра шаблона, а не из перечней внутри этого файла.

  Перечень отставал молча: добавленный в шаблон файл просто не доезжал до сайтов,
  и узнавалось это случайно - так остались за бортом пять навыков и вся папка
  описаний интерфейса. Реестр обновляет разметчик по правилам, и оба смотрят
  на одно и то же.
*/
const zones = readRegistry(sourceDir);
if (zones.size === 0) {
  fail(
    `ERROR: разметка не найдена в источнике (${REGISTRY}).
` + '  Собери её в шаблоне: node scripts/zones.mjs --all',
  );
}

/** Файлы зоны - ровно те, что размечены. Не каталоги. */
function filesOf(zone) {
  return [...zones.entries()]
    .filter(([, z]) => z === zone)
    .map(([rel]) => rel)
    .sort();
}

/*
  Раскладываем пофайлово, а не по каталогам.

  Свёртка до каталога тянула вместе с нашими файлами всё, что лежит рядом:
  на первом же живом сайте так поехали база сайта и следы сборки. Реестр знает
  каждый файл поимённо - по нему и работаем.
*/
const MIRROR = filesOf('mirror');
const OVERLAY = filesOf('overlay');

/** Каталоги с нашими зеркальными файлами: там ищем своё устаревшее. */
const MIRROR_DIRS = [
  ...new Set(
    MIRROR.filter((rel) => rel.includes('/')).map((rel) => rel.split('/').slice(0, -1).join('/')),
  ),
].sort();

if (includeClaude) {
  MIRROR.push('CLAUDE.md');
  MIRROR.push('README.md');
}

/** Пакеты, у которых команды общие: корень и три рабочих. */
const SCRIPT_PACKAGES = [
  'package.json',
  'contracts/package.json',
  'src/client/package.json',
  'src/cms/package.json',
];

/** Не копируем и не удаляем — instance-owned либо мусор сборки. */
const EXCLUDED_NAMES = new Set(['domain', 'node_modules', '.next', 'dist']);
const isExcluded = (name) => EXCLUDED_NAMES.has(name) || name.endsWith('.local');

// ─── Синк ──────────────────────────────────────────────────────────────

const stats = { copied: 0, deleted: 0, skipped: 0, missing: [] };

/*
  Перечень положенного - память синка о том, какие файлы в инстанс принёс он сам.

  Без него зеркало не отличает наше устаревшее от чужого самодельного: и то,
  и другое просто «нет в шаблоне». Раньше удалялось и то, и другое, поэтому свой
  примитив сайта пропадал молча, а обнаруживалось это упавшей сборкой.

  Теперь удаляется только то, что синк когда-то принёс. Всё остальное остаётся
  на месте, а прогон останавливается со столкновением: имя занято чужим файлом,
  его надо переименовать или унести в свою доменную папку.
*/
const MANIFEST = path.join(INSTANCE, '.template-manifest');
const MANIFEST_VERSION = 1;

/** Прошлый перечень: путь -> отпечаток содержимого, каким его положил синк. */
const previous = new Map();
if (fs.existsSync(MANIFEST)) {
  for (const line of fs.readFileSync(MANIFEST, 'utf8').split(String.fromCharCode(10))) {
    const row = line.trim();
    if (!row || row.startsWith('#')) continue;
    const gap = row.lastIndexOf(' ');
    if (gap === -1) previous.set(row, '');
    else previous.set(row.slice(0, gap), row.slice(gap + 1));
  }
}

/*
  Первое знакомство: перечня ещё нет, потому что сайт обновлялся прежней версией
  синка. Тогда всё, что лежит в зонах, считается нашим - оно и приехало отсюда,
  просто список тогда не вёлся. Иначе первый же прогон объявил бы чужим весь сайт
  и встал стеной столкновений.
*/
const firstMeeting = previous.size === 0;

/** Что положил этот прогон: путь -> отпечаток. */
const placed = new Map();
/** Имя занято чужим файлом. */
const conflicts = [];
/** Наш файл, правленный на месте: перезапись потеряла бы правку. */
const edited = [];
/** Ваши файлы в наших папках: не трогаем, но говорим о них. */
const foreign = [];

/** Разведка идёт без записи: сперва узнаём о столкновениях, потом трогаем сайт. */
let writing = false;
const shouldWrite = () => writing && !dryRun;

function fingerprint(file) {
  return createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 12);
}

/** Путь относительно корня инстанса, всегда через прямые косые. */
function relToInstance(target) {
  return path.relative(INSTANCE, target).split(path.sep).join('/');
}

/**
 * Один проход раскладки. Первый идёт разведкой, без записи.
 */
function pass() {
  console.log(`\n→ Mirror (${MIRROR.length} файлов, наше устаревшее рядом удаляется)\n`);
  for (const rel of MIRROR) syncPath(rel, true);
  sweepStale();

  console.log(`\n→ Overlay (${OVERLAY.length} файлов, ваши добавки сохраняются)\n`);
  for (const rel of OVERLAY) syncPath(rel, false);

  // package.json целиком не копируется: там имя пакета, версия и зависимости
  // инстанса. Но команды сборки и проверок в нём общие, и без этого правка команды
  // в шаблоне до сайтов не доезжала — файл-помощник приезжал, а вызов его нет.
  syncScripts();

  // index.ts миграций — общий файл шаблона и инстанса. Копировать его нельзя:
  // upstream-версия не знает про доменные миграции инстанса и молча выключила бы
  // их из прогона. Собираем список заново по тому, что реально лежит в каталоге.
  rebuildMigrationsIndex();
}

/*
  Сперва разведка, потом запись.

  Если остановиться посреди раскладки, сайт останется наполовину обновлённым -
  часть файлов новая, часть старая, и это хуже обеих крайностей. Поэтому сначала
  проходим всё вхолостую, собираем столкновения, и только на чистом результате
  трогаем сайт.
*/
const quiet = console.log;
if (!dryRun) console.log = () => {};
pass();
console.log = quiet;

if (conflicts.length > 0 || edited.length > 0) {
  console.log('\n──────────────────────────────────────────────');
  if (conflicts.length > 0) {
    console.log(`\n⚠ Имя занято чужим файлом (${conflicts.length}):\n`);
    for (const rel of conflicts.slice(0, 40)) console.log(`   ${rel}`);
    if (conflicts.length > 40) console.log(`   … и ещё ${conflicts.length - 40}`);
    console.log(
      '\n  Синхронизация не выполнена. Эти файлы синк сюда не клал, а имена нужны ему:\n' +
        '  наши компоненты ссылаются на них, и подмена сломала бы и ваше, и наше.\n' +
        '  Переименуйте их или унесите в свою доменную папку и запустите снова.',
    );
  }
  if (edited.length > 0) {
    console.log(`\n⚠ Наши файлы правлены на месте (${edited.length}):\n`);
    for (const rel of edited.slice(0, 40)) console.log(`   ${rel}`);
    if (edited.length > 40) console.log(`   … и ещё ${edited.length - 40}`);
    console.log(
      '\n  Обновление затёрло бы эти правки. Перенесите их в свою доменную папку\n' +
        '  либо предложите в шаблон.',
    );
  }
  console.log('\n  Продавить и обновить всё равно: --force\n');
  console.log('──────────────────────────────────────────────');
  if (cleanupSource) fs.rmSync(sourceDir, { recursive: true, force: true });
  process.exit(1);
}

// Разведка прошла чисто - идём настоящим проходом.
if (!dryRun) {
  placed.clear();
  foreign.length = 0;
  stats.copied = 0;
  stats.deleted = 0;
  stats.skipped = 0;
  writing = true;
  pass();
}

// На Windows нет POSIX-бита: git пишет новый файл как 100644, и на VPS
// `deploy.sh` не запускается — GH Actions падает на «found but not executable»
// (exit 126), уже после успешного билда и git pull. Ищем все .sh, не ведём
// список: любой скрипт, который приезжает синком, должен быть исполняемым.
const fixedModes = restoreExecutableBits();
if (fixedModes.length > 0) {
  console.log(`\n→ Executable bit restored (${fixedModes.length}): ${fixedModes.join(', ')}`);
}

if (!dryRun) {
  /*
    Перечень положенного: память синка о том, что он сюда принёс. По нему
    следующий прогон отличит наше устаревшее от чужого самодельного и не удалит
    того, чего не клал.
  */
  fs.writeFileSync(
    MANIFEST,
    [
      '# Что положил сюда синк шаблона. Правится только им.',
      `manifest_version=${MANIFEST_VERSION}`,
      `source_sha=${sourceSha}`,
      '',
      ...[...placed.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([rel, mark]) => `${rel} ${mark}`),
      '',
    ].join(String.fromCharCode(10)),
  );
  console.log(`\n  ✓ .template-manifest → ${placed.size} файлов`);

  const versionFile = path.join(INSTANCE, '.template-version');
  const previous = fs.existsSync(versionFile)
    ? (fs.readFileSync(versionFile, 'utf8').match(/^source_sha=(.*)$/m)?.[1] ?? '')
    : '';
  fs.writeFileSync(
    versionFile,
    [
      '# Holy Grail template sync marker.',
      '# Update by sync-template on every sync.',
      `source_sha=${sourceSha}`,
      `source_ref=${ref}`,
      `synced_at=${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}`,
      `previous_sha=${previous}`,
      '',
    ].join('\n'),
  );
  console.log(`\n  ✓ .template-version → ${versionFile}`);
}

/*
  Точка сборки сайта обязана подключать набор движка - иначе приехавшее в наборе
  до сайта не доходит: коллекция лежит файлом, а в сборке её нет, и проверка типов
  падает на ссылке в несуществующее. Ловить это молча проверкой типов дорого,
  поэтому говорим сразу и готовой строкой.
*/
const SEAMS = [
  {
    файл: 'contracts/src/index.ts',
    признак: "from './engine'",
    строка: "export * from './engine';",
  },
  {
    файл: 'src/cms/src/payload.config.ts',
    признак: 'engineCollections',
    строка: 'collections: [...engineCollections, /* свои */].map(withAutoSlug),',
  },
  {
    файл: 'src/cms/src/payload.config.ts',
    признак: 'engineTasks',
    строка: 'jobs: { tasks: [...engineTasks, /* свои */], ... }',
  },
  {
    файл: 'src/cms/src/blocks/index.ts',
    признак: 'ENGINE_PAGE_BLOCKS',
    строка: 'export const PAGE_BLOCKS = [...ENGINE_PAGE_BLOCKS, /* свои */];',
  },
  {
    файл: 'src/client/src/layouts/site-layout/block-registry.tsx',
    признак: 'engineRegistry',
    строка: 'const REGISTRY = { ...engineRegistry, /* свои */ };',
  },
];

const seamGaps = [];
for (const seam of SEAMS) {
  const full = path.join(INSTANCE, seam.файл);
  if (!fs.existsSync(full)) continue;
  if (!fs.readFileSync(full, 'utf8').includes(seam.признак)) seamGaps.push(seam);
}

if (seamGaps.length > 0) {
  console.log(`
⚠ Точки сборки не подключают набор движка (${seamGaps.length}):
`);
  for (const seam of seamGaps) {
    console.log(`   ${seam.файл}`);
    console.log(`      добавьте: ${seam.строка}`);
  }
  console.log(
    `${String.fromCharCode(10)}  Без этого приехавшее в наборе до сайта не дойдёт: файл лежит, а в сборке его нет.`,
  );
}

if (foreign.length > 0) {
  console.log(`
→ Ваши файлы в наших папках (${foreign.length}, не тронуты):
`);
  for (const rel of foreign.slice(0, 20)) console.log(`   ${rel}`);
  if (foreign.length > 20) console.log(`   … и ещё ${foreign.length - 20}`);
  console.log(
    `
  Место рискованное: при следующем обновлении это имя может занять наш файл.
  Надёжнее держать своё в доменной папке - её синк не обходит вовсе.`,
  );
}

if (cleanupSource) fs.rmSync(sourceDir, { recursive: true, force: true });

console.log('\n──────────────────────────────────────────────');
console.log(
  `Итог: ${stats.copied} обновлено, ${stats.deleted} удалено, ${stats.skipped} без изменений` +
    (dryRun ? '  (DRY RUN — ничего не записано)' : ''),
);
if (stats.missing.length > 0) {
  console.log(`Нет в источнике (пропущено): ${stats.missing.join(', ')}`);
}
console.log(`\nДальше в ${INSTANCE}:`);
console.log('  1. git status / git diff --stat   — что изменилось');
console.log('  2. pnpm install                   — если поехали зависимости');
console.log('  3. pnpm -r lint                   — typecheck');
console.log('  4. pnpm --filter cms check:schema — схема vs миграции');
console.log('  5. git checkout -b chore/sync-template && git add -A && git commit');
console.log('──────────────────────────────────────────────');

// ─── Реализация ────────────────────────────────────────────────────────

function syncPath(rel, mirror) {
  const src = path.join(sourceDir, rel);
  const dst = path.join(INSTANCE, rel);
  if (!fs.existsSync(src)) {
    stats.missing.push(rel);
    return;
  }
  if (fs.statSync(src).isDirectory()) copyDir(src, dst, mirror, rel);
  else copyFile(src, dst, rel);
}

function copyDir(src, dst, mirror, label) {
  if (!dryRun) fs.mkdirSync(dst, { recursive: true });

  const srcEntries = fs.readdirSync(src, { withFileTypes: true });
  const keep = new Set();

  for (const entry of srcEntries) {
    if (isExcluded(entry.name)) continue;
    keep.add(entry.name);
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    const rel = `${label}${entry.name}${entry.isDirectory() ? '/' : ''}`;
    if (entry.isDirectory()) copyDir(s, d, mirror, `${rel}`);
    else copyFile(s, d, rel);
  }

  /*
    Убираем устаревшее - но только то, что синк сам когда-то принёс: путь есть
    в перечне положенного с прошлого прогона, а в шаблоне его больше нет.

    Чужой файл в той же папке не наш: его никто не приносил, значит его завёл
    сам сайт. Такой не трогаем, а собираем столкновением.
  */
  if (mirror && fs.existsSync(dst)) {
    for (const entry of fs.readdirSync(dst, { withFileTypes: true })) {
      if (keep.has(entry.name) || isExcluded(entry.name)) continue;
      const victim = path.join(dst, entry.name);
      const rel = relToInstance(victim);
      const ours = previous.has(rel) || [...previous.keys()].some((x) => x.startsWith(`${rel}/`));

      /*
        Чужого не трогаем и прогон из-за него не останавливаем: шаблон такого файла
        не кладёт, значит затирать нечего. Но говорим о нём - он лежит в нашей папке,
        и при следующем обновлении это имя может занять наш файл.

        На первом знакомстве перечня нет, и чужим считается всё подряд -
        там молчим, иначе вывод утонет в ложных срабатываниях.
      */
      if (!ours) {
        if (!firstMeeting) foreign.push(rel + (entry.isDirectory() ? '/' : ''));
        continue;
      }

      /*
        Наше устаревшее удаляем - но только нетронутым. Правленный файл это уже
        работа сайта, и она остаётся, даже если из шаблона вещь ушла.
      */
      const mark = previous.get(rel);
      if (!entry.isDirectory() && mark && fingerprint(victim) !== mark) {
        placed.set(rel, mark);
        continue;
      }

      if (writing || dryRun) {
        console.log(`  - ${label}${entry.name}${entry.isDirectory() ? '/' : ''}`);
        stats.deleted++;
      }
      if (shouldWrite()) fs.rmSync(victim, { recursive: true, force: true });
    }
  }
}

function copyFile(src, dst, label) {
  const rel = relToInstance(dst);
  const exists = fs.existsSync(dst);

  /*
    Файл на месте, но синк его туда не клал - имя занято чужим. Не трогаем:
    наши компоненты ссылаются на это имя, и подмена файла ломает и то, и другое.
  */
  if (exists && !previous.has(rel) && !firstMeeting) {
    if (!force) {
      conflicts.push(rel);
      return;
    }
  } else if (exists && previous.get(rel) && fingerprint(dst) !== previous.get(rel)) {
    /*
      Наш файл, но правленный на месте: перезапись потеряла бы правку молча.
      Продавить можно явно - тогда правка уходит, и человек знает об этом заранее.
    */
    if (!force) {
      edited.push(rel);
      return;
    }
  }

  placed.set(rel, fingerprint(src));

  if (exists && sameContent(src, dst)) {
    stats.skipped++;
    return;
  }
  if (writing || dryRun) {
    console.log(`  ${exists ? 'M' : '+'} ${label}`);
    stats.copied++;
  }
  if (!shouldWrite()) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

/**
 * Пересобирает `src/cms/migrations/index.ts` инстанса по файлам, которые в этом
 * каталоге реально лежат: приехавшие из шаблона плюс доменные миграции самого
 * инстанса. Порядок — по имени файла, оно начинается с даты, так что
 * лексикографическая сортировка совпадает с хронологической.
 *
 * Без этого шага downstream, обновивший шаблон, получил бы либо список без
 * своих миграций (если копировать upstream-файл), либо список без новых
 * upstream-миграций (если не копировать вовсе).
 */
/**
 * Сливает поле scripts по ключам: команда из шаблона добавляется или обновляется,
 * а имя пакета, версия и зависимости инстанса остаются нетронутыми.
 *
 * Свои команды инстанса не удаляются — он вправе завести собственные. А вот общий
 * ключ со своим значением - это отставшая копия, а не кастомизация: инстанс-специфика
 * у нас живёт в переменных окружения, не в командах. Такое значение обновляется,
 * и в выводе печатается, что было и что стало.
 *
 * Ровно на этом ловилась случайно падающая сборка (#92): шаблон давно зовёт своего
 * помощника, который проверяет результат генерации и повторяет попытку, а инстансы
 * остались на прямом вызове. Файл-помощник к ним приезжал, вызов - нет.
 */
function syncScripts() {
  console.log(`
→ Package.json (${SCRIPT_PACKAGES.length} файлов: команды и зависимости)
`);
  for (const rel of SCRIPT_PACKAGES) {
    const from = path.join(sourceDir, rel);
    const to = path.join(INSTANCE, rel);
    if (!fs.existsSync(from) || !fs.existsSync(to)) continue;

    const upstream = JSON.parse(fs.readFileSync(from, 'utf8'));
    const instance = JSON.parse(fs.readFileSync(to, 'utf8'));
    let touched = false;

    /*
      Команды общие: своё значение у общего ключа - это отставшая копия,
      а не настройка сайта. Обновляем и показываем, что было и что стало.
    */
    const theirs = upstream.scripts ?? {};
    const ours = instance.scripts ?? {};
    const added = [];
    const differs = [];
    for (const [key, value] of Object.entries(theirs)) {
      if (!(key in ours)) {
        ours[key] = value;
        added.push(key);
      } else if (ours[key] !== value) {
        differs.push({ key, was: ours[key], now: value });
        ours[key] = value;
      }
    }
    const own = Object.keys(ours).filter((key) => !(key in theirs));
    if (added.length || differs.length) {
      instance.scripts = ours;
      touched = true;
    }

    /*
      Зависимости - иначе приехавший код не на чем держится: примитивы просят
      движок листания и плеер, а их у сайта нет, и проверка типов падает
      на «нет такого модуля». Добавляем недостающее; версии, которые сайт
      выбрал сам, не трогаем - только называем.
    */
    const deps = [];
    const versions = [];
    for (const поле of ['dependencies', 'devDependencies']) {
      const их = upstream[поле] ?? {};
      const наши = instance[поле] ?? {};
      for (const [имя, версия] of Object.entries(их)) {
        if (!(имя in наши)) {
          наши[имя] = версия;
          deps.push(`${поле === 'devDependencies' ? 'dev:' : ''}${имя}`);
        } else if (наши[имя] !== версия) {
          versions.push(`${имя}: у вас ${наши[имя]}, в шаблоне ${версия}`);
        }
      }
      if (Object.keys(наши).length) instance[поле] = наши;
    }
    if (deps.length) touched = true;

    if (!touched) {
      stats.skipped++;
      continue;
    }

    if (shouldWrite()) {
      fs.writeFileSync(
        to,
        `${JSON.stringify(instance, null, 2)}
`,
      );
    }
    stats.copied++;

    if (added.length > 0)
      console.log(`  ${dryRun ? '=' : '+'} ${rel}: команды ${added.join(', ')}`);
    for (const d of differs) {
      console.log(`  ${dryRun ? '=' : '~'} ${rel}: команда ${d.key} обновлена`);
      console.log(`      было:  ${d.was}`);
      console.log(`      стало: ${d.now}`);
    }
    if (deps.length > 0) {
      console.log(`  ${dryRun ? '=' : '+'} ${rel}: зависимости ${deps.join(', ')}`);
      console.log('      после прогона нужна установка: pnpm install');
    }
    for (const v of versions) console.log(`  · ${rel}: ${v} - оставляем вашу`);
    if (own.length > 0) console.log(`  · ${rel}: своих команд ${own.length}, не трогаем`);
  }
}

/**
 * Убирает наше устаревшее: файл лежит в зеркальной папке, синк его когда-то принёс,
 * а в шаблоне его больше нет.
 *
 * Чужого не трогает вовсе - его никто сюда не клал; правленного нашего тоже:
 * это уже работа сайта, даже если вещь из шаблона ушла.
 */
function sweepStale() {
  const ours = new Set(MIRROR);
  for (const dir of MIRROR_DIRS) {
    const full = path.join(INSTANCE, dir);
    if (!fs.existsSync(full)) continue;
    for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
      if (!entry.isFile() || isExcluded(entry.name)) continue;
      const rel = `${dir}/${entry.name}`;
      if (ours.has(rel)) continue;

      /*
        Собственность сайта не трогаем, даже если она когда-то попала в перечень
        по ошибке. Иначе уборка сносит имя пакета, вход контракта и прочее, без чего
        сайт перестаёт существовать - поймано ровно этим на первом живом прогоне.
      */
      if (classify(rel) !== 'mirror') continue;

      const mark = previous.get(rel);
      if (mark === undefined) {
        if (!firstMeeting) foreign.push(rel);
        continue;
      }
      if (mark && fingerprint(path.join(INSTANCE, rel)) !== mark) {
        placed.set(rel, mark);
        continue;
      }
      if (writing || dryRun) {
        console.log(`  - ${rel}`);
        stats.deleted++;
      }
      if (shouldWrite()) fs.rmSync(path.join(INSTANCE, rel), { force: true });
    }
  }
}

function rebuildMigrationsIndex() {
  const dir = path.join(INSTANCE, 'src/cms/migrations');
  const indexFile = path.join(dir, 'index.ts');
  if (!fs.existsSync(dir)) return;

  const names = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.slice(0, -3))
    .sort();
  if (names.length === 0) return;

  const body =
    names.map((n) => `import * as migration_${n} from './${n}';`).join('\n') +
    '\n\nexport const migrations = [\n' +
    names
      .map(
        (n) =>
          `  {\n    up: migration_${n}.up,\n    down: migration_${n}.down,\n    name: '${n}',\n  },`,
      )
      .join('\n') +
    '\n];\n';

  const unchanged = fs.existsSync(indexFile) && fs.readFileSync(indexFile, 'utf8') === body;
  if (unchanged) return;

  console.log(`\n→ Migrations index пересобран (${names.length} миграций)`);
  if (!dryRun) fs.writeFileSync(indexFile, body);
}

/**
 * Возвращает исполняемость всем `*.sh` инстанса: и на диске (важно для WSL и
 * Linux), и в индексе git (единственное, что доедет до VPS). Файлы, ещё не
 * добавленные в индекс, чинятся на диске — режим подхватится при `git add`.
 */
function restoreExecutableBits() {
  const listed = safeGit(['ls-files', '-s', '*.sh'], INSTANCE);
  if (!listed) return [];

  const fixed = [];
  for (const line of listed.trim().split('\n')) {
    // Формат `ls-files -s`: <mode> <object> <stage>\t<path>
    const match = line.match(/^(\d{6})\s+\S+\s+\d+\t(.+)$/);
    if (!match) continue;
    const [, mode, file] = match;

    const abs = path.join(INSTANCE, file);
    if (!dryRun && fs.existsSync(abs)) {
      fs.chmodSync(abs, 0o755);
    }
    if (mode === '100755') continue;

    fixed.push(file);
    if (!dryRun) safeGit(['update-index', '--chmod=+x', file], INSTANCE);
  }
  return fixed;
}

function sameContent(a, b) {
  const sa = fs.statSync(a);
  const sb = fs.statSync(b);
  if (sa.size !== sb.size) return false;
  return fs.readFileSync(a).equals(fs.readFileSync(b));
}

function git(argv, cwd) {
  return execFileSync('git', argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function safeGit(argv, cwd) {
  try {
    return git(argv, cwd).trim();
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readHelp() {
  return `sync-template — обновить инстанс Holy Grail из template.

  node scripts/sync-template.mjs <instance-path> [--ref <ref>] [--repo <path-or-url>] [--dry-run] [--include-claude]

  --ref            ветка/тег/sha источника (default: main)
  --repo           путь к локальному клону WHG или GitHub-репо (default: сам WHG)
  --dry-run        показать что изменится, ничего не писать
  --include-claude синкать CLAUDE.md (перезапишет downstream-правки)`;
}
