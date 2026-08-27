import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Из чего состоит блок: тег и имя части.
 *
 * Владелец правит вид блока своим CSS и должен видеть, до чего внутри может
 * дотянуться. Состав читается из кода самих компонентов, а не из объявлений
 * рядом с блоком: объявление живёт отдельно от разметки и расходится с ней
 * при первой же правке.
 */
export interface BlockPartRow {
  readonly tag: string;
  readonly name: string;
  readonly depth: number;
}

const CLIENT = path.resolve(process.cwd(), '../client/src');
const REGISTRY = path.join(CLIENT, 'layouts/site-layout/block-registry.tsx');

/** Какой компонент рисует блок: `'hero': (node) => <Hero …`. */
function componentOf(blockType: string): string | null {
  if (!existsSync(REGISTRY)) return null;
  const source = readFileSync(REGISTRY, 'utf8');

  // Ключ в реестре пишут и в кавычках, и без: 'hero-split' рядом с videoSet.
  const pair = [...source.matchAll(/'?([\w-]+)'?:\s*\([^)]*\)\s*=>\s*\(?\s*<(\w+)/g)].find(
    ([, type]) => type === blockType,
  );
  const component = pair?.[2];
  if (!component) return null;

  return imports(REGISTRY, source)[component] ?? null;
}

/** Собственные модули проекта: чужие пакеты обходить незачем. */
function imports(fromFile: string, source: string): Record<string, string> {
  const dir = path.dirname(fromFile);
  const found: Record<string, string> = {};

  const add = (name: string, spec: string) => {
    const file = resolve(dir, spec);
    if (file) found[name] = file;
  };

  for (const match of source.matchAll(/import\s+\{([^}]+)\}\s+from\s+'([^']+)'/g)) {
    for (const raw of (match[1] ?? '').split(',')) {
      const name = raw.trim().split(' as ').pop()?.trim();
      if (name) add(name, match[2] ?? '');
    }
  }
  for (const match of source.matchAll(/import\s+(\w+)\s+from\s+'([^']+)'/g)) {
    add(match[1] ?? '', match[2] ?? '');
  }
  return found;
}

function resolve(fromDir: string, spec: string): string | null {
  const base = spec.startsWith('@/')
    ? path.join(CLIENT, spec.slice(2))
    : spec.startsWith('.')
      ? path.resolve(fromDir, spec)
      : null;
  if (!base) return null;

  for (const candidate of [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx')]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Части блока - его собственные и те, что пришли из вложенных компонентов.
 *
 * @remarks
 * Плеер тянет список, список - карточку, поэтому обход идёт по импортам.
 * Глубину задаёт спрашивающий: на первом уровне видно устройство самого блока,
 * глубже - его начинку. Без предела список разрастается до значков и подписей,
 * до которых никто не тянется.
 */
export function collectBlockParts(blockType: string, depth: number): readonly BlockPartRow[] {
  const start = componentOf(blockType);
  if (!start) return [];

  const seen = new Set<string>();
  const rows: BlockPartRow[] = [];

  const walk = (file: string, level: number) => {
    if (level > depth || seen.has(file) || !existsSync(file)) return;
    seen.add(file);

    const source = readFileSync(file, 'utf8');
    /*
      Тег ищется от признака назад, а не вперёд от тега: между ними лежат другие
      атрибуты, и в любом из них может встретиться угловая скобка - хоть
      в обработчике `onClick={() => …}`, хоть в условии. Поиск вперёд на такой
      скобке обрывался, и часть терялась.
    */
    for (const match of source.matchAll(
      /<([a-zA-Z][\w.]*)((?:[^<]|<(?!\/))*?)data-part="([\w-]+)"/g,
    )) {
      const name = match[3] ?? '';
      if (rows.some((row) => row.name === name)) continue;

      /*
        Признак ставят и на тег, и на вложенный компонент. Во втором случае
        настоящий тег отсюда не виден - он живёт в самом компоненте, - поэтому
        имя компонента за тег не выдаём: показывать чужое имя хуже, чем ничего.
      */
      const written = match[1] ?? '';
      const tag = /^[a-z]/.test(written) ? written : '';
      rows.push({ tag, name, depth: level });
    }

    for (const nested of Object.values(imports(file, source))) {
      walk(nested, level + 1);
    }
  };

  walk(start, 0);
  return rows;
}
