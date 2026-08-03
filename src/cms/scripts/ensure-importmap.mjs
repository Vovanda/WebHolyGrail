/**
 * Генерация importMap с проверкой результата.
 *
 * `payload generate:importmap` умеет завершиться с нулевым кодом, ничего не
 * записав. Дальше `next build` падает на «Can't resolve '../importMap.js'», и
 * причина выглядит как ошибка в коде — хотя код не менялся, а сборка на том же
 * коммите со второго раза проходит. В CI это ловится проверкой, но в образе
 * сборка шла без неё, и деплой падал через несколько минут работы.
 *
 * Поэтому: генерируем, проверяем файл, при пустом результате повторяем. Если и
 * повторы не помогли — падаем с понятным сообщением, а не с ошибкой webpack.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const cmsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(cmsRoot, 'src/app/(payload)/admin/importMap.js');
const ATTEMPTS = 3;

const written = () => existsSync(target) && statSync(target).size > 0;

for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
  const result = spawnSync('pnpm', ['exec', 'payload', 'generate:importmap'], {
    cwd: cmsRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  });

  if (written()) {
    if (attempt > 1) console.log(`importMap сгенерирован с попытки ${attempt}`);
    process.exit(0);
  }

  console.warn(
    `importMap не записан (попытка ${attempt} из ${ATTEMPTS}, код ${result.status ?? 'нет'})`,
  );
}

console.error(
  `Не удалось сгенерировать ${target}. ` +
    'Команда отработала вхолостую — проверьте, что payload.config.ts загружается ' +
    'с текущим окружением.',
);
process.exit(1);
