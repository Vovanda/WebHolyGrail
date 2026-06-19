# Infra journal — что в репо стоит, зачем, и как с этим жить

> Живая карта инфраструктуры. Когда добавляется что-то новое — здесь появляется запись. Когда что-то удаляется — запись правится с пометкой `[удалено YYYY-MM-DD, причина]`.
> Цель: через год не гадать «откуда этот хук, что он делает, как его отключить».
>
> Источник правды по архитектуре — Memory MCP `HolyGrail/00..90`. Тут — про инструменты в репо, не про идеи.

## Сводная таблица

| Слой                | Инструмент                                                             | Когда добавлено               | Где сконфигурено                                                 | Зачем                                                                                                                                                    |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build / монорепо    | pnpm 11 workspaces                                                     | 2026-06-19 (08512b0)          | `pnpm-workspace.yaml`, `package.json`                            | Быстрая установка, симлинки, родные workspaces                                                                                                           |
| TypeScript база     | TS 5.6, strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes | 2026-06-19 (08512b0)          | `tsconfig.base.json`                                             | Жёсткие типы с первого дня, без лазеек                                                                                                                   |
| Стиль кода          | Prettier 3.8                                                           | 2026-06-19 (этот коммит)      | `.prettierrc.json`, `.prettierignore`                            | Единый стиль форматирования, без споров                                                                                                                  |
| Pre-commit гейт     | husky 9 + lint-staged 17                                               | 2026-06-19 (этот коммит)      | `.husky/pre-commit`, `.lintstagedrc.json`                        | Форматируем только staged, не весь проект                                                                                                                |
| Commit-message гейт | commitlint + config-conventional                                       | 2026-06-19 (f218930)          | `.husky/commit-msg`, `commitlint.config.js`                      | `type(scope): summary` обязателен; «wip» не пройдёт                                                                                                      |
| Версионирование     | @changesets/cli                                                        | 2026-06-19 (f218930)          | `.changeset/config.json`, scripts `changeset`/`version-packages` | Полу-автомат semver-бамп на основе changeset-файлов                                                                                                      |
| Секреты — храним    | Infisical Cloud (CLI на хосте)                                         | 2026-06-19 (56325d6)          | `docs/secrets/README.md`, `sites/veo55/.env.example`             | Один источник правды для всех env, переносимо dev↔prod                                                                                                   |
| Секреты — защита #1 | `.gitignore` (`.env`, `*secret*` mask, `secrets/` запрет)              | 2026-06-19 (8017d36)          | `.gitignore`                                                     | Первая линия — `*secret*` ловит любой файл с этим словом в имени; .env-файлы блочатся отдельно. Исключение — `docs/secrets/` (документация без значений) |
| Секреты — защита #2 | gitleaks 8 + `.gitleaks.toml` allowlist                                | 2026-06-19 (этот коммит)      | `.gitleaks.toml`, `.husky/pre-commit`, `.husky/pre-push`         | Вторая линия — даже если попало в staged, хук блокирует                                                                                                  |
| EOL / encoding      | `.gitattributes` LF default, CRLF для .bat/.ps1                        | 2026-06-19 (8017d36)          | `.gitattributes`                                                 | Docker = Linux = LF, Windows-скрипты остаются CRLF                                                                                                       |
| Editor конвенции    | EditorConfig                                                           | 2026-06-19 (8017d36)          | `.editorconfig`                                                  | 2-space LF UTF-8, единое поведение IDE                                                                                                                   |
| Контракты           | `@veo55/contracts` workspace                                           | 2026-06-19 (efd89b0)          | `sites/veo55/contracts/`                                         | R3-разъём между client и cms, типы PageDoc/MediaDoc/BlockNode                                                                                            |
| CMS                 | Payload 3.85 + Next 15 + React 19 + SQLite (drizzle)                   | 2026-06-19 (187bd8b)          | `sites/veo55/src/cms/`                                           | Контент-слой, админка на русском, JWT-auth, SQLite-файл в volume                                                                                         |
| Client (фронт)      | Next 15 + React 19 + Tailwind 3.4 + tokens.css                         | 2026-06-19 (605206e)          | `sites/veo55/src/client/`                                        | Публичный SSR-фронт; читает CMS через `@veo55/contracts` (R3); токены — единый источник цвета/типографики (R2)                                           |
| Local docker stack  | Docker Compose (client + cms, named volumes, bridge net)               | 2026-06-19 (fc1b5d4)          | `sites/veo55/deploy/local/`                                      | Воспроизводимый локальный стек; healthcheck'и + depends_on service_healthy; SQLite/Media в named volumes для бэкапа                                      |
| E2E smoke           | Playwright 1.49 + chromium                                             | 2026-06-19 (этот коммит)      | `sites/veo55/src/client/playwright/`                             | Главная отвечает 200 + title из CMS (R3 живой); админка отвечает 200 на русском. Не запускает свои dev — ожидает запущенные сервера (или compose)        |
| Агентский слой      | `.claude/rules/common.md` + project `settings.json`                    | 2026-06-19 (8017d36, 08512b0) | `.claude/rules/`, `.claude/settings.json`                        | R1–R9 в развёрнутом виде, allow-list для команд                                                                                                          |

## Подробнее по слоям

### pnpm workspace

- `pnpm-workspace.yaml`: packages = `sites/*/contracts`, `sites/*/src/{client,cms}`, `packages/*`.
- `allowBuilds: { esbuild: true }` — pnpm 11 требует явно одобрять postinstall-скрипты. Сейчас включён только esbuild (для Vitest и потенциально для CMS-сборки).
- Если добавится новый пакет с native-сборкой → потребует ручного `pnpm approve-builds` и добавления в `allowBuilds`.

### TypeScript

- Все workspace-пакеты `extends "../../../tsconfig.base.json"`.
- Включены: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `forceConsistentCasingInFileNames`.
- **Override не делать без причины.** Если в каком-то пакете надо отключить флаг — оставить коммент в его `tsconfig.json` зачем и привязать к тикету.

### Husky хуки

- `.husky/pre-commit`:
  1. `pnpm exec lint-staged` — Prettier по staged-файлам (быстро).
  2. `gitleaks protect --staged --redact --config .gitleaks.toml` — если gitleaks установлен; иначе предупреждение.
- `.husky/commit-msg`:
  - `pnpm exec commitlint --edit "$1"` — валидирует conventional-commit формат.
- `.husky/pre-push`:
  - Если есть upstream → `gitleaks detect --log-opts="@{push}..HEAD"` (только не-pushed коммиты, **incremental**).
  - Если upstream нет → fallback на последние 50 коммитов.

**Как обойти хук в крайнем случае** (рекомендация: не делать без явной причины и без явного `ок` владельца):

```bash
git commit --no-verify -m "..."
git push --no-verify
```

Если так пришлось — записать причину в commit body и сразу запланировать fix.

### lint-staged

- `.lintstagedrc.json` сейчас гоняет только `prettier --write`.
- ESLint будет добавлен **когда появится первый JS/TS-код за пределами contracts** (R9 — не плодить инструмент авансом).
- Vitest на pre-commit не вешаем — тесты в CI и в `pnpm test` на ручной запрос. Pre-commit должен оставаться быстрым (<2 сек).

### commitlint

- `commitlint.config.js`, ESM (потому что `"type": "module"` в корневом package.json).
- Разрешённые `type`: `feat / fix / refactor / test / docs / chore / perf / ci / build / style / revert`.
- `header-max-length: 100`. Тело и футер без лимита (heredoc-коммиты на 5–12 пунктов укладываются).

### Changesets

- `.changeset/config.json`:
  - `commit: false` — changesets сами не коммитят, мы делаем явно.
  - `privatePackages.version: true`, `tag: false` — версии бампим даже для приватных пакетов, но git tags не плодим (пока нет публикации).
  - `ignore: [veo55-client, veo55-cms]` — leaf-приложения сайта не версионируем (пока не понадобится — например при втором клиенте может появиться смысл).
- Workflow: после фичи → `pnpm changeset` → выбрать пакет(ы) + bump + описание. Перед релизом → `pnpm version-packages` → коммитим вместе с изменением версии.

### Локальные dev-креды (`dev-secrets.md`)

- Файл в корне репо, **gitignored через маску `*secret*`** (см. `.gitignore` строка про секреты).
- Содержит креды для запуска dev-сервисов **локально** (Payload admin, SMTP-sandbox и пр.).
- **Не для прода** — для прода Infisical и только Infisical.
- Если на новой машине нет файла — пересоздать руками или восстановить из Bitwarden / `infisical export --env=dev`.
- Любой файл с `secret` в имени (singular/plural) автоматически блокируется git — это умышленная сеть-страховка.

### Infisical (секреты)

- Локально: `infisical login` один раз, потом `infisical init` в `sites/veo55/` (создаёт `.infisical.json`, в .gitignore).
- Запуск: `infisical run --env=dev -- pnpm dev`.
- На VPS: service-token → `infisical run --env=prod --token=$INFISICAL_TOKEN -- docker compose up -d`.
- Подробная инструкция — `docs/secrets/README.md`.

### gitleaks

- Установка: `winget install Gitleaks.Gitleaks` (или choco, или brew).
- Конфиг — `.gitleaks.toml`, наследуется от default ruleset (`useDefault = true`).
- Allowlist: `.env.example`, `docs/secrets/*.md`, `pnpm-lock.yaml`, `CHANGELOG.md`, `__fixtures__`, `*.test.*`, `*.spec.*`.
- Плейсхолдер-паттерны в allowlist: `EXAMPLE`, `PLACEHOLDER`, `YOUR_KEY_HERE`, `<...>`, `${...}`.
- Если ловит false positive — добавить путь/regex в allowlist + написать сюда **зачем** добавил.

### `.claude/` агентский слой

- `CLAUDE.md` — корневая инструкция (для агента и человека).
- `.claude/rules/common.md` — R1–R9 развёрнуто.
- `.claude/settings.json` — project allow-list команд + enabled plugins (`frontend-design@claude-plugins-official`).
- `.claude/settings.local.json` (gitignored) — personal SSH-ключи Володи + PuTTY paths.

## Что НЕ установлено (и почему — фиксируем чтобы не повторять обсуждение)

| Что                             | Почему пока нет                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| ESLint                          | Будет добавлен с первым настоящим TS-кодом (Next/Payload). Сейчас нечего линтовать — только типы. |
| Vitest на pre-commit            | Тесты гоняем по `pnpm test` руками и в CI. Pre-commit должен быть <2с.                            |
| Husky lint-staged для тестов    | См. выше — pre-commit быстрый.                                                                    |
| CI (GitHub Actions / GitLab CI) | Появится когда репо уедет на remote и появится первый PR. Сейчас локально + git без remote.       |
| Turbo / Nx                      | Pnpm workspaces достаточно для двух-трёх пакетов. Turbo появится если сборка станет долгой (R9).  |
| Sentry / Loki / Grafana         | R7 — observability по факту нужды, не авансом. Сначала `docker compose logs`.                     |
| Storybook                       | Появится если каталог блоков выйдет за 10+ и понадобится playground (R9).                         |

## Когда сюда что-то добавить

- **Добавил новую DevDependency верхнего уровня** (eslint, vitest, какой-то bundler) — запись в таблицу + раздел подробнее.
- **Добавил новый хук / поменял существующий** — обновить раздел «Husky хуки» + таблицу.
- **Включил новый flag в `tsconfig.base.json`** — раздел TypeScript.
- **Установил утилиту через winget / choco / brew** — запись с тем, как переустановить на новой машине.
- **Завёл новое окружение в Infisical** — раздел Infisical.
- **Удалил инструмент** — запись остаётся с пометкой `[удалено YYYY-MM-DD, причина]`.
