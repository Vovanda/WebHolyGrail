# Infra journal — что в template стоит, зачем, и как с этим жить

> Карта стека для людей и AI-ассистентов. Когда меняется зависимость / инструмент / гейт — здесь правится строка. Когда что-то удаляется — пометить `[удалено YYYY-MM-DD, причина]`.
>
> Цель: новый разработчик (или Claude в свежей сессии) за 5 минут видит **что есть, зачем и где сконфигурено**, не блуждая по конфигам. Архитектурные правила — в [`docs/whg/30-philosophy.md`](whg/30-philosophy.md); здесь — про инструменты в репо, не про идеи.
>
> Инстансы (downstream сайты) поддерживают свой собственный `docs/infra-journal.md` с конкретикой (VPS, домены, project IDs) — не дублировать сюда.

## Сводная таблица

| Слой                 | Инструмент                                                                                        | Где сконфигурено                                                             | Зачем                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Build / монорепо     | pnpm 11 workspaces                                                                                | `pnpm-workspace.yaml`, `package.json`                                        | Быстрая установка, симлинки, родные workspaces                                                             |
| TypeScript база      | TS 5.6, strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes                            | `tsconfig.base.json`                                                         | Жёсткие типы с первого дня, без лазеек                                                                     |
| Стиль кода           | Prettier 3.8                                                                                      | `.prettierrc.json`, `.prettierignore`                                        | Единый стиль форматирования, без споров                                                                    |
| Pre-commit гейт      | husky 9 + lint-staged 17                                                                          | `.husky/pre-commit`, `.lintstagedrc.json`                                    | Форматируем только staged, не весь проект                                                                  |
| Commit-message гейт  | commitlint + config-conventional                                                                  | `.husky/commit-msg`, `commitlint.config.js`                                  | `type(scope): summary` обязателен; «wip» не пройдёт                                                        |
| Версионирование      | @changesets/cli                                                                                   | `.changeset/config.json`, npm scripts `changeset` / `version-packages`       | Полу-автомат semver-бамп на основе changeset-файлов                                                        |
| Секреты — храним     | self-host Infisical + Universal Auth machine identity                                             | `.infisical.json` (workspaceId), `/etc/infisical/<slug>/{client-id,...}` VPS | Один источник правды dev↔staging↔prod; см. [`whg-infisical`](../.claude/skills/whg-infisical/SKILL.md)     |
| Секреты — защита #1  | `.gitignore` (`.env`, `*secret*` mask, `secrets/` запрет)                                         | `.gitignore`                                                                 | Первая линия — `*secret*` ловит любой файл с этим словом; .env-файлы блочатся отдельно                     |
| Секреты — защита #2  | gitleaks 8 + `.gitleaks.toml` allowlist                                                           | `.gitleaks.toml`, `.husky/pre-commit`, `.husky/pre-push`                     | Вторая линия — даже если попало в staged, хук блокирует. Allowlist для скачанных read-only skills          |
| EOL / encoding       | `.gitattributes` LF default, CRLF для .bat/.ps1                                                   | `.gitattributes`                                                             | Docker = Linux = LF, Windows-скрипты остаются CRLF                                                         |
| Editor конвенции     | EditorConfig                                                                                      | `.editorconfig`                                                              | 2-space LF UTF-8, единое поведение IDE                                                                     |
| Контракты            | `contracts/` workspace                                                                            | `contracts/`                                                                 | R3-разъём между client и cms, одна сторона зависимости                                                     |
| CMS                  | Payload 3.x + Next 15 + React 19 + SQLite (drizzle, default; Postgres opt)                        | `src/cms/`                                                                   | Контент-слой, генерируемая админка, JWT-auth, SQLite-файл в volume                                         |
| Client (фронт)       | Next 15 + React 19 + Tailwind 3.x + tokens.css                                                    | `src/client/`                                                                | Публичный SSR-фронт; читает CMS через `contracts/` (R3); токены — единый источник цвета/типографики (R2)   |
| Local docker stack   | Docker Compose (client + cms + MinIO, named volumes)                                              | `deploy/local/`                                                              | Воспроизводимый локальный стек; healthcheck'и + depends_on service_healthy                                 |
| Media storage        | `@payloadcms/storage-s3` → любое S3-совместимое (VK Cloud, R2, B2, MinIO)                         | `src/cms/src/payload.config.ts` (plugins)                                    | S3 mandatory с первого дня, никакого local-disk fallback (избегаем миграционных болей)                     |
| E2E smoke            | Playwright 1.x + chromium                                                                         | `src/client/playwright/`                                                     | Главная отвечает 200; админка отвечает 200. Не запускает свои dev — ожидает запущенные сервера или compose |
| Theme infrastructure | `[data-theme="<name>"]` + ThemeBootstrap inline-script + SiteSettings.theme                       | `tokens.css`, `lib/theme-bootstrap.tsx`, Payload `SiteSettings` global       | SSR-safe переключение тем без FOUC; light/dark/auto + opt-in userToggle                                    |
| Production deploy    | blue-green через `infisical run` + docker compose + nginx upstream symlink                        | `deploy/prod/{deploy.sh,compose.bluegreen.yml}`                              | Zero-downtime cutover, idempotent migrations, healthcheck + auto rollback                                  |
| Skills / агенты      | `.claude/skills/whg-*` (наши) + скачанные официальные (`payload`, `infisical-*`, `cms-migration`) | `.claude/skills/`                                                            | Reusable workflows для AI; naming convention с префиксом `whg-` для наших                                  |

## Подробнее по слоям

### pnpm workspace

- `pnpm-workspace.yaml`: packages = `contracts`, `src/{client,cms}`, `packages/*`.
- `allowBuilds` — pnpm 11 требует явно одобрять postinstall-скрипты. Если добавится новый пакет с native-сборкой → `pnpm approve-builds` + добавить в whitelist.

### TypeScript

- Все workspace-пакеты `extends "../tsconfig.base.json"` (путь относительно глубины).
- Включены: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`, `forceConsistentCasingInFileNames`.
- **Override не делать без причины.** Если в каком-то пакете надо отключить флаг — оставить комментарий в его `tsconfig.json` зачем и привязать к issue.

### Husky хуки

- `.husky/pre-commit`:
  1. `pnpm exec lint-staged` — Prettier по staged-файлам (быстро).
  2. `gitleaks protect --staged --redact --config .gitleaks.toml` — если gitleaks установлен; иначе предупреждение.
- `.husky/commit-msg`:
  - `pnpm exec commitlint --edit "$1"` — валидирует conventional-commit формат.
- `.husky/pre-push`:
  - Если есть upstream → `gitleaks detect --log-opts="@{push}..HEAD"` (только не-pushed коммиты, **incremental**).
  - Если upstream нет → fallback на последние 50 коммитов.

**Как обойти хук в крайнем случае** (не делать без явной причины и без явного `ок` владельца):

```bash
git commit --no-verify -m "..."
git push --no-verify
```

Если так пришлось — записать причину в commit body и сразу запланировать fix.

### gitleaks

- `.gitleaks.toml` — allowlist по paths для **скачанных read-only** skills (`infisical-*`, `payload`, `cms-migration`) которые могут содержать пример-токены в своих docs.
- Для **наших** файлов (`.claude/skills/whg-*`, `docs/`, scripts) — inline `# gitleaks:allow` на конкретной строке если ложное срабатывание (см. `feedback_gitleaks_inline_vs_paths`).

### Infisical

- **Один self-host instance** per organisation, shared между всеми сайтами. Не клонировать per-site.
- **Project per site** — `holygrail-<slug>`, авто через `pnpm setup-infisical --site <slug>`.
- **Per-site UA machine identity** для prod deploy: creds в `/etc/infisical/<slug>/{client-id,client-secret,project-id}` (chmod 600 deploy).
- Полный workflow — [`whg-infisical` skill](../.claude/skills/whg-infisical/SKILL.md), end-to-end scaffold — [`37-scaffolding.md`](whg/37-scaffolding.md).

### Payload CMS

- Версия pinned в `src/cms/package.json`. Апгрейд через [`payload-migration` skill](../.claude/skills/whg-payload-migration/SKILL.md) — schema-aware миграции.
- Default БД — SQLite (`file:./data/site.db`). Postgres — одна строка в adapter swap, когда трафик пойдёт (см. issue #28 DISCUSS).
- Background jobs (sync контента, импорт, периодики) — Payload 3.x Jobs Queue, см. [`whg-payload-jobs`](../.claude/skills/whg-payload-jobs/SKILL.md).

### S3 / Media

- `@payloadcms/storage-s3` plugin в `src/cms/src/payload.config.ts`.
- В dev — MinIO в Docker (auto-started `dev-setup.sh`), bucket `local-media`.
- В prod — любой S3-совместимый провайдер: VK Cloud, Yandex Object Storage, Backblaze B2 (free 10GB), Cloudflare R2 (free 10GB), MinIO Cloud, AWS S3.
- `S3_*` секреты — в Infisical, не в коде.
- Если `S3_BUCKET` пустой при boot — Payload **fail-loud**, нет silent local-disk fallback.

### Email (transactional)

- WHG template сам не приколочен к одному SMTP-провайдеру — это инстанс-решение.
- Для self-host Infisical recovery / Payload notifications — free tier любого SMTP-провайдера: [Resend](https://resend.com) (3000/мес), [Brevo](https://brevo.com) (300/день), [MailerSend](https://mailersend.com) (3000/мес).
- SMTP-creds в Infisical (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME`).
- Если нужен бизнес-inbox (`info@`, `support@`) — отдельный mail-host (VK WorkSpace free 5 ящиков, Yandex 360 paid, любой ваш). Transactional ≠ inbox.

### Production deploy

- `deploy/prod/deploy.sh` — blue-green с `infisical run --token=... --projectId=... --env=prod -- docker compose ...`
- Healthcheck 60s → migrate (idempotent) → nginx upstream symlink switch → drain old color
- Auto-cleanup unused images / buildx cache в конце
- Подробности — [`whg-infisical` skill](../.claude/skills/whg-infisical/SKILL.md#prod-deploy)

### Skills (Claude / AI агенты)

- Наши: `.claude/skills/whg-*/SKILL.md` — парные с `docs/whg/*.md` (правка одного → правка обоих).
- Скачанные официальные: `payload`, `infisical-*` (setup/self-host/secret-syncs/dynamic/agent/terraform/api), `cms-migration` — базовое знание от вендоров, не править.
- Личные / cross-project: `frontend-design`, `async-workflow` — глобально у разработчика.
- Naming convention — см. [`whg-skill-authoring`](../.claude/skills/whg-skill-authoring/SKILL.md).

## Что НЕ здесь

- **Архитектурные правила R1-R9** — в [`docs/whg/30-philosophy.md`](whg/30-philosophy.md).
- **Decision rationale для project types** — в [`docs/whg/32-structure.md`](whg/32-structure.md) + issue #27 DISCUSS.
- **Конкретные VPS / IP / project IDs** — в `<instance-repo>/docs/infra-journal.md` (не в template — template generic).
- **Скриншоты / Hugo docs site** — отдельная история, не часть инфры.
