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
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ─── Аргументы ─────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let instanceArg = '';
let ref = 'main';
let repo = '';
let dryRun = false;
let includeClaude = false;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--ref') ref = args[++i];
  else if (arg === '--repo') repo = args[++i];
  else if (arg === '--dry-run') dryRun = true;
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

// ─── Whitelists ────────────────────────────────────────────────────────

/** Зеркалим: устаревшие файлы внутри этих путей удаляются. */
const MIRROR = [
  // Client
  'src/client/src/ui/',
  'src/client/src/blocks/primitives/',
  'src/client/src/blocks/layout/',
  'src/client/src/blocks/system/',
  'src/client/src/layouts/',
  'src/client/src/lib/api-client.ts',
  'src/client/src/lib/utils.ts',
  'src/client/src/lib/seo/',
  'src/client/src/lib/analytics.tsx',
  'src/client/src/lib/theme-bootstrap.tsx',
  'src/client/src/lib/lexical-text.ts',
  'src/client/src/lib/blog-settings.ts',
  'src/client/src/lib/palette-presets.ts',
  'src/client/src/lib/palette-override.tsx',
  'src/client/src/styles/',

  // Конфиги сборки клиента. Едут вместе с tokens.css: маппинг «токен → утилита»
  // живёт в tailwind.config, и без него новый токен приезжает в инстанс мёртвым —
  // класс в JSX есть, утилиты нет, стиль молча не применяется. Инстансы эти
  // файлы не кастомизируют: по R2 все значения и так в CSS-переменных.
  'src/client/tailwind.config.ts',
  'src/client/postcss.config.mjs',
  'src/client/vitest.config.ts',

  // CI и деплой. Вся инстанс-специфика в них уже вынесена в GH vars/secrets,
  // так что чинится деплой один раз в шаблоне и доезжает до всех сайтов.
  // template-cleanup.yml сюда не входит — он про сам шаблон.
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',

  // Блог — generic-маршруты движка. Инстансу без блога они не мешают:
  // пустые коллекции → /blog отдаёт «пока статей нет».
  'src/client/src/app/(site)/blog/',
  'src/client/src/app/sitemap.ts',
  'src/client/src/app/robots.ts',
  // Catchall — рендер страниц из Payload по slug, чистый generic: доменные
  // маршруты инстанса живут отдельными папками и его не трогают. Инстансовый
  // layout.tsx сюда не входит — там шрифты и брендинг конкретного сайта.
  'src/client/src/app/(site)/[[...slug]]/page.tsx',

  // CMS — generic collections + блоки
  'src/cms/src/blocks/',
  'src/cms/src/collections/Pages.ts',
  'src/cms/src/collections/Media.ts',
  'src/cms/src/collections/Users.ts',
  'src/cms/src/collections/FormSubmissions.ts',
  'src/cms/src/collections/ReusableBlocks.ts',
  'src/cms/src/collections/SocialPosts.ts',
  'src/cms/src/collections/Comments.ts',
  'src/cms/src/collections/FaqGroups.ts',
  'src/cms/src/collections/Articles.ts',
  'src/cms/src/collections/Authors.ts',
  'src/cms/src/collections/Tags.ts',
  'src/cms/src/collections/Threads.ts',
  'src/cms/src/globals/SiteSettings.ts',
  // Generic-хелперы CMS (транслитерация slug и т.п.) — на них ссылаются
  // коллекции из MIRROR, без них инстанс просто не соберётся.
  'src/cms/src/lib/',
  // Админ-компоненты полей + копия палитр. Копия обязана совпадать с
  // client-версией (R3 не даёт cms импортировать из client), и разъезд этих
  // двух файлов ничем не заметен — значит ездить они должны вместе.
  'src/cms/src/admin/',
  'src/cms/scripts/check-schema-drift.ts',

  // Contracts — только generic
  'contracts/src/blocks.ts',
  'contracts/src/faq.ts',
  'contracts/src/forms.ts',
  'contracts/src/globals.ts',
  'contracts/src/layout.ts',
  'contracts/src/media.ts',
  'contracts/src/notices.ts',
  'contracts/src/pages.ts',
  'contracts/src/reusable.ts',
  'contracts/src/social.ts',
  'contracts/src/theme.ts',
  'contracts/src/blog.ts',

  // Deploy
  'deploy/',

  // Root scripts
  'dev.sh',
  'dev-setup.sh',
  'scripts/sync-template.mjs',
  'scripts/sync-template.sh',

  // Generic configs
  'commitlint.config.js',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
  '.husky/',
  '.gitleaks.toml',
  '.changeset/config.json',
  '.editorconfig',
  '.prettierrc.json',
  '.prettierignore',
  '.gitattributes',
  '.env.local.example',
  '.npmrc',

  // Issue templates
  '.github/ISSUE_TEMPLATE/',
];

/** Overlay: обновляем существующее, downstream-добавки не удаляем. */
const OVERLAY = [
  'docs/whg/',
  'docs/stack/',
  '.claude/skills/whg-rules/',
  '.claude/skills/whg-layouts/',
  '.claude/skills/whg-modals/',
  '.claude/skills/whg-ui-reference/',
  '.claude/skills/whg-infisical/',
  '.claude/skills/whg-template-sync/',
  '.claude/skills/whg-payload-jobs/',
  '.claude/skills/whg-payload-migration/',
  '.claude/skills/whg-git-commit/',
  '.claude/skills/payload/',
  '.claude/skills/cms-migration/',
  '.claude/skills/infisical-setup/',
  '.claude/skills/infisical-self-host/',
  '.claude/skills/infisical-secret-syncs/',
  '.claude/skills/infisical-dynamic-secrets/',
  '.claude/skills/infisical-agent/',
  '.claude/skills/infisical-terraform/',
  '.claude/skills/infisical-api/',
];

if (includeClaude) {
  MIRROR.push('CLAUDE.md');
  console.log('  ↳ --include-claude: CLAUDE.md included (перезапишет локальные правки)');
}

/** Не копируем и не удаляем — instance-owned либо мусор сборки. */
const EXCLUDED_NAMES = new Set(['domain', 'node_modules', '.next', 'dist']);
const isExcluded = (name) => EXCLUDED_NAMES.has(name) || name.endsWith('.local');

// ─── Синк ──────────────────────────────────────────────────────────────

const stats = { copied: 0, deleted: 0, skipped: 0, missing: [] };

console.log(`\n→ Mirror (${MIRROR.length} путей, устаревшее внутри них удаляется)\n`);
for (const rel of MIRROR) syncPath(rel, true);

console.log(`\n→ Overlay (${OVERLAY.length} путей, downstream-добавки сохраняются)\n`);
for (const rel of OVERLAY) syncPath(rel, false);

if (!dryRun) {
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

  // Аналог rsync --delete: то, чего в источнике больше нет.
  if (mirror && fs.existsSync(dst)) {
    for (const entry of fs.readdirSync(dst, { withFileTypes: true })) {
      if (keep.has(entry.name) || isExcluded(entry.name)) continue;
      const victim = path.join(dst, entry.name);
      console.log(`  - ${label}${entry.name}${entry.isDirectory() ? '/' : ''}`);
      stats.deleted++;
      if (!dryRun) fs.rmSync(victim, { recursive: true, force: true });
    }
  }
}

function copyFile(src, dst, label) {
  if (fs.existsSync(dst) && sameContent(src, dst)) {
    stats.skipped++;
    return;
  }
  console.log(`  ${fs.existsSync(dst) ? 'M' : '+'} ${label}`);
  stats.copied++;
  if (dryRun) return;
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
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
