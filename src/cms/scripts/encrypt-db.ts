/**
 * Перевод базы под ключ и обратно.
 *
 * @remarks
 * Зашифровать файл на месте нельзя: ключ задаётся при открытии, и база либо
 * рождается закрытой, либо остаётся открытой навсегда. Поэтому перевод - это
 * пересоздание: читаем одну базу, наливаем содержимое во вторую, открытую
 * с нужным ключом.
 *
 * Исходник остаётся на месте. Подменять живую базу здесь нечем: сайт держит
 * её открытой, и первым делом его надо остановить - а это решение того, кто
 * переводит, а не скрипта.
 *
 * Обратный ход тем же способом. Без него ключ становится ловушкой: потерял -
 * потерял и базу, а вспомнить об этом хочется до того, как это случится.
 *
 * Запуск:
 *
 * ```bash
 * # закрыть открытую базу ключом
 * DATABASE_ENCRYPTION_KEY=... pnpm --filter cms encrypt:db data/site.db data/site.enc.db
 *
 * # открыть закрытую обратно
 * DATABASE_ENCRYPTION_KEY=... pnpm --filter cms encrypt:db --open data/site.enc.db data/site.db
 * ```
 *
 * Дальше сайт останавливается, файл занимает место прежнего, ключ уходит
 * в Infisical - и только потом сайт поднимается.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';

import Database from 'libsql';

/** Подпись обычной базы: у закрытой её нет. */
const PLAIN_HEAD = 'SQLite format 3';

type OpenOptions = ConstructorParameters<typeof Database>[1] & { encryptionKey?: string };

function main(): void {
  const args = process.argv.slice(2);
  const opening = args.includes('--open');
  const [from, to] = args.filter((value) => value !== '--open');

  if (!from || !to) {
    console.error('Нужны два довода: откуда и куда. Признак --open переводит закрытую в открытую.');
    process.exit(1);
  }
  if (!existsSync(from)) {
    console.error(`База не найдена: ${from}`);
    process.exit(1);
  }
  if (existsSync(to)) {
    console.error(`Цель уже существует: ${to}. Уберите её сами - молча затирать базу нельзя.`);
    process.exit(1);
  }

  const key = process.env['DATABASE_ENCRYPTION_KEY'] ?? '';
  if (!key) {
    console.error('Ключ не задан: переводить нечем. Проверьте DATABASE_ENCRYPTION_KEY.');
    process.exit(1);
  }

  const closed =
    readFileSync(from).subarray(0, PLAIN_HEAD.length).toString('latin1') !== PLAIN_HEAD;
  if (opening && !closed) {
    console.error('Эта база и так открыта: переводить нечего.');
    process.exit(1);
  }
  if (!opening && closed) {
    console.error('Эта база уже под ключом. Чтобы открыть её, добавьте --open.');
    process.exit(1);
  }

  /*
    Ключ нужен ровно одной стороне: закрываем - целевой, открываем - исходной.
    Дальше содержимое переливается одним `VACUUM INTO`: он пишет целую базу,
    а не построчный дамп, поэтому переносятся и индексы, и настройки страницы.
  */
  const source = new Database(from, (opening ? { encryptionKey: key } : {}) as OpenOptions);
  if (opening) {
    source.exec(`VACUUM INTO '${to.replace(/\\/g, '/')}'`);
    console.log(`база открыта: ${to} (${size(to)})`);
    return;
  }

  /*
    Целевую заводим заранее и с ключом: `VACUUM INTO` пишет в новый файл как
    есть, без шифрования - проверено. Поэтому льём через присоединение, а не
    выгрузкой в сторону.
  */
  const target = new Database(to, { encryptionKey: key } as OpenOptions);
  target.exec(`ATTACH DATABASE '${from.replace(/\\/g, '/')}' AS plain KEY ''`);

  /*
    Проверку связей на время переливки снимаем: таблицы наливаются по одной,
    и та, на которую ссылается уже налитая, приходит позже. Порядком это не
    лечится - в живой базе ссылки идут в обе стороны. Проверено: без этого
    перевод падает на первой же связи.
  */
  target.exec('PRAGMA foreign_keys = OFF');
  copyAll(target);
  target.exec('PRAGMA foreign_keys = ON');
  target.exec('DETACH DATABASE plain');

  /*
    Спрашиваем у самой базы, сошлись ли связи после переливки: молча отдать
    битую копию хуже, чем не отдать никакой.
  */
  const broken = target.prepare('PRAGMA foreign_key_check').all() as unknown[];
  if (broken.length > 0) {
    console.error(`связи не сошлись: нарушений ${broken.length}. Файл ${to} не годится.`);
    process.exit(1);
  }

  console.log(`база закрыта ключом: ${to} (${size(to)})`);
}

/**
 * Переносит всё содержимое присоединённой базы в текущую.
 *
 * @remarks
 * Сначала описания таблиц и индексов, потом строки: иначе вставлять некуда.
 * Служебные таблицы SQLite пропускаем - они создаются сами.
 */
function copyAll(db: InstanceType<typeof Database>): void {
  const schema = db
    .prepare('SELECT type, name, sql FROM plain.sqlite_master WHERE sql IS NOT NULL')
    .all() as Array<{ type: string; name: string; sql: string }>;

  for (const item of schema) {
    if (item.name.startsWith('sqlite_')) continue;
    if (item.type === 'table') db.exec(item.sql);
  }

  for (const item of schema) {
    if (item.name.startsWith('sqlite_') || item.type !== 'table') continue;
    db.exec(`INSERT INTO main."${item.name}" SELECT * FROM plain."${item.name}"`);
  }

  // Индексы и представления ставим после строк: так вставка идёт быстрее,
  // а результат тот же.
  for (const item of schema) {
    if (item.name.startsWith('sqlite_') || item.type === 'table') continue;
    db.exec(item.sql);
  }
}

function size(path: string): string {
  const bytes = statSync(path).size;
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} МБ`
    : `${Math.round(bytes / 1024)} КБ`;
}

try {
  main();
} catch (error: unknown) {
  console.error('перевод не вышел:', error instanceof Error ? error.message : error);
  process.exit(1);
}
