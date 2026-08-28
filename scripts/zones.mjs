#!/usr/bin/env node
/**
 * Разметчик файлов шаблона по зонам.
 *
 * Usage:
 *   node scripts/zones.mjs              # обновить метки изменившихся файлов
 *   node scripts/zones.mjs --all        # пройти всё дерево и переписать реестр
 *   node scripts/zones.mjs --print      # показать разметку таблицей
 *   node scripts/zones.mjs --check      # ничего не писать, сказать, разошёлся ли реестр
 *
 * Зачем: зоны раньше жили перечнями путей внутри синка и отставали молча - новый файл
 * просто не доезжал до сайтов. Теперь зона вычисляется правилом по месту файла,
 * результат лежит реестром, и синк читает его же.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { REGISTRY, classify, readRegistry, writeRegistry } from './lib/zones.mjs';

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '..',
);

/**
 * Файлы шаблона - те, что под присмотром истории.
 *
 * Обходить дерево целиком нельзя: рядом лежит сгенерированное - типы и карта
 * импортов, - которого в истории нет. Локально его может не быть вовсе, а в прогоне
 * проверок оно появляется раньше разметки, и реестр каждый раз выглядел бы
 * разошедшимся.
 */
function trackedFiles() {
  return execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
    .split(String.fromCharCode(10))
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((rel) => !rel.split('/').some((part) => IGNORED.has(part)));
}

const IGNORED = new Set(['node_modules', '.next', 'dist', 'domain', '.tmp', '.playwright-mcp']);

const args = process.argv.slice(2);
const all = args.includes('--all');
const print = args.includes('--print');
const check = args.includes('--check');

const registry = readRegistry(ROOT);

/** Изменившиеся файлы: по ним и обновляем метки, полный проход тут не нужен. */
function changedFiles() {
  const out = [];
  for (const argv of [
    ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD'],
    ['diff', '--name-only', '--diff-filter=ACMR', '--cached'],
    ['ls-files', '--others', '--exclude-standard'],
  ]) {
    try {
      out.push(
        ...execFileSync('git', argv, { cwd: ROOT, encoding: 'utf8' }).split(
          String.fromCharCode(10),
        ),
      );
    } catch {
      /* нет истории - просто не берём этот источник */
    }
  }
  return [...new Set(out.map((line) => line.trim()).filter(Boolean))];
}

if (print) {
  const счёт = new Map();
  for (const zone of registry.values()) счёт.set(zone, (счёт.get(zone) ?? 0) + 1);
  console.log(`\nРазметка из ${REGISTRY}:\n`);
  for (const [zone, n] of [...счёт.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${zone.padEnd(10)} ${String(n).padStart(4)}`);
  }
  const всего = trackedFiles().length;
  console.log(`\n  в реестре ${registry.size}, файлов в дереве ${всего}\n`);
  process.exit(0);
}

const targets = all
  ? trackedFiles()
  : changedFiles().filter(
      (rel) => fs.existsSync(path.join(ROOT, rel)) && fs.statSync(path.join(ROOT, rel)).isFile(),
    );

const before = new Map(registry);
if (all) registry.clear();

for (const rel of targets) {
  const zone = classify(rel);
  if (zone === 'skip') registry.delete(rel);
  else registry.set(rel, zone);
}

// удалённые файлы уходят из реестра сами
for (const rel of [...registry.keys()]) {
  if (!fs.existsSync(path.join(ROOT, rel))) registry.delete(rel);
}

const изменилось =
  before.size !== registry.size || [...registry].some(([rel, zone]) => before.get(rel) !== zone);

if (check) {
  if (изменилось) {
    console.error(`\n${REGISTRY} разошёлся с деревом. Обнови его: node scripts/zones.mjs\n`);
    process.exit(1);
  }
  console.log(`${REGISTRY} в порядке`);
  process.exit(0);
}

const строк = writeRegistry(ROOT, registry);
console.log(
  изменилось
    ? `${REGISTRY}: обновлено, ${строк} файлов размечено${all ? ' (полный проход)' : ''}`
    : `${REGISTRY}: без изменений`,
);
