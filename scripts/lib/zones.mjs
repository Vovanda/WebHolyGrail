/**
 * Разметка файлов шаблона по зонам - общий источник для разметчика и синка.
 *
 * @remarks
 * Раньше зоны задавались двумя перечнями путей прямо в синке. Перечень отстаёт
 * молча: новый файл в шаблоне просто не доезжает до сайтов, и узнаётся об этом
 * случайно - так остались за бортом пять навыков и вся папка описаний интерфейса.
 *
 * Теперь зона вычисляется правилом по месту файла, а результат лежит реестром
 * в шаблоне. Разметчик обновляет реестр, синк его читает - оба смотрят на одно
 * и то же, и добавленный файл размечается сам.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Файл реестра в корне шаблона. */
export const REGISTRY = 'template-registry.tsv';

/**
 * Зоны.
 *
 * `mirror` - папка целиком наша: файл заменяется, наше устаревшее внутри удаляется.
 * `overlay` - сайт законно кладёт своё рядом: обновляем своё, чужое не трогаем.
 * `skip` - не копируется вовсе: это собственность сайта.
 */
export const ZONES = ['mirror', 'overlay', 'skip'];

/**
 * Что не обходим вовсе - ни в шаблоне, ни в сайте.
 *
 * @remarks
 * `domain` - доменное сайта: его синк не трогает вовсе. В маршрутах Next такую
 * папку не назвать просто `domain` - имя попало бы в адрес, - поэтому там она
 * берётся в скобки: `(domain)` группирует, не влияя на адрес. Обходу нужно
 * знать оба вида, иначе доменные страницы уезжали бы сайтам, которым эта ниша
 * не нужна.
 */
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'coverage',
  '.turbo',
  'domain',
  '(domain)',
  '.playwright-mcp',
  '.tmp',
]);

/**
 * Правила по порядку: первое совпавшее решает.
 *
 * Читаются вслух: доменное - собственность сайта; где сайт кладёт своё рядом
 * с нашим - наложение; остальное, что вообще есть в шаблоне, - зеркало.
 */
const RULES = [
  /*
    Доменное - собственность сайта, включая доменное самого шаблона: витрина
    такой же сайт, и её блоки нужны ей одной. Правило стоит первым, потому что
    иначе путь попадает в общее зеркало и уезжает ко всем.

    Обход дерева такие папки и так пропускает, но разметка идёт по изменившимся
    файлам: переехавший в domain файл без этого правила оставался в реестре
    зеркалом до следующего полного прохода.

    Скобочная группа маршрутов считается тем же: `(domain)` у витрины давала
    сайту второй путь к тем же адресам, и сборка вставала на «две страницы
    ведут в одно место».
  */
  [/(^|\/)\(?domain\)?\//, 'skip'],
  // Собственность сайта: имя, адреса, ключи, стартовое наполнение.
  [/^(package\.json|pnpm-lock\.yaml|README\.md|CLAUDE\.md|LICENSE)$/, 'skip'],
  // пример настроек едет: по нему сайт заводит свои. Сами настройки - нет.
  [/^\.env\.local\.example$/, 'mirror'],
  [/^\.(env|infisical|template-version|template-manifest)/, 'skip'],
  [/^src\/(client|cms)\/package\.json$/, 'skip'],
  [/^contracts\/package\.json$/, 'skip'],
  [/^src\/cms\/src\/payload\.config\.ts$/, 'skip'],
  [/^src\/client\/src\/site\.config\.ts$/, 'skip'],
  [/^scripts\/seeds\//, 'skip'],
  [/^src\/cms\/src\/seed\//, 'skip'],
  /*
    Точки сборки - собственность сайта: там он дописывает своё доменное к набору
    движка. Возить их нельзя, иначе обновление стирает эту регистрацию (R10).
    Сами наборы движка - файлы с именем engine - ездят и всегда полны.
  */
  [/^contracts\/src\/index\.ts$/, 'skip'],
  [/^src\/cms\/src\/blocks\/index\.ts$/, 'skip'],
  [/^src\/client\/src\/layouts\/site-layout\/block-registry\.tsx$/, 'skip'],
  // Оба макета - инстансовые: там шрифты и брендинг конкретного сайта.
  [/^src\/client\/src\/app\/layout\.tsx$/, 'skip'],
  [/^src\/client\/src\/app\/\(site\)\/layout\.tsx$/, 'skip'],
  // Данные сайта и следы сборки не возим вовсе.
  [/^src\/cms\/data\//, 'skip'],
  [/\.tsbuildinfo$/, 'skip'],
  // сборка создаёт их сама
  [/next-env\.d\.ts$/, 'skip'],
  [/^docs\/(infra|secrets)\//, 'skip'],
  [/^docs\/infra-journal\.md$/, 'skip'],
  [/^\.github\/workflows\/template-cleanup\.yml$/, 'skip'],
  [/^template-registry\.tsv$/, 'skip'],

  // Наложение: сайт добавляет своё в ту же папку.
  /*
    Миграции движка едут все: шаблон - не сайт, бизнес-логики в нём нет, и каждая
    его миграция улучшает шаблон целиком. Наложением, чтобы доменные миграции
    сайта остались на месте.

    Индекс возить нельзя - у сайта свой состав, и копия из шаблона выключила бы
    его доменные миграции из прогона. Синк пересобирает индекс по фактическому
    содержимому каталога.
  */
  [/^src\/cms\/migrations\/index\.ts$/, 'skip'],
  [/^src\/cms\/migrations\//, 'overlay'],
  [/^src\/client\/src\/lib\//, 'overlay'],
  [/^src\/client\/public\//, 'overlay'],
  [/^docs\//, 'overlay'],
  [/^\.claude\/skills\//, 'overlay'],
  [/^DEPLOY\.md$/, 'overlay'],

  // Всё остальное, что лежит в шаблоне, - наше целиком.
  [/^(src|contracts|deploy|scripts|\.github|\.husky|\.changeset)\//, 'mirror'],
  [
    /^(dev\.sh|dev-setup\.sh|commitlint\.config\.js|pnpm-workspace\.yaml|tsconfig\.base\.json)$/,
    'mirror',
  ],
  [
    /^\.(dockerignore|gitleaks\.toml|editorconfig|prettierrc\.json|prettierignore|gitattributes|npmrc)$/,
    'mirror',
  ],
];

/** Зона файла по его пути от корня шаблона. */
export function classify(rel) {
  const p = rel.split(path.sep).join('/');
  for (const [pattern, zone] of RULES) {
    if (pattern.test(p)) return zone;
  }
  return 'skip';
}

/** Все файлы шаблона, кроме заведомо необходимых. */
export function walk(root, base = root, out = []) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name) || entry.name.endsWith('.local')) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) walk(full, base, out);
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

/** Реестр с диска: путь -> зона. */
export function readRegistry(root) {
  const file = path.join(root, REGISTRY);
  const map = new Map();
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split(String.fromCharCode(10))) {
    const row = line.trim();
    if (!row || row.startsWith('#')) continue;
    const [zone, rel] = row.split('\t');
    if (zone && rel) map.set(rel, zone);
  }
  return map;
}

/** Записать реестр, отсортировав по пути: так его правки читаются в истории. */
export function writeRegistry(root, map) {
  const rows = [...map.entries()]
    .filter(([, zone]) => zone !== 'skip')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rel, zone]) => `${zone}\t${rel}`);
  const head = [
    '# Разметка файлов шаблона по зонам. Обновляется scripts/zones.mjs.',
    '# mirror - заменяем и убираем своё устаревшее; overlay - обновляем, чужое не трогаем.',
    '# Строки со skip не хранятся: это собственность сайта.',
    '',
  ];
  fs.writeFileSync(
    path.join(root, REGISTRY),
    head.concat(rows).join(String.fromCharCode(10)) + String.fromCharCode(10),
  );
  return rows.length;
}
