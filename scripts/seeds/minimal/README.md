# Seed: minimal

Минимальный project-type preset для нового Holy Grail сайта.

## Что создаёт

- **Initial admin user** — `Users.role=admin`, email из `ADMIN_INITIAL_EMAIL`, пароль из `ADMIN_INITIAL_PASSWORD`. Если password не задан — admin не создаётся, юзер получит first-user wizard на `/admin`.
- **Home page** — пустая `Pages` запись, `slug=home`, `_status=published`, без блоков.
- **FAQ** — стартовые группы + `/faq` страница + пункт в mainNav.

Идемпотентно: повторный запуск не дублирует, существующие записи не трогает. В `deploy/prod/deploy.sh` запускается автоматически после успешных миграций.

## Запуск

```bash
# из корня репо
ADMIN_INITIAL_EMAIL=admin@example.com \
ADMIN_INITIAL_PASSWORD="$(openssl rand -hex 16)" \
pnpm seed:minimal
```

Legacy env `SEED_ADMIN_EMAIL/PASSWORD/NAME` + `SEED_FORCE_ADMIN_PASSWORD` — читаются как fallback (deprecated).

Требуется уже поднятый CMS workspace (`./dev.sh` или `pnpm --filter cms run dev`), потому что seed использует Payload Local API и нуждается в инициализированной БД.

## Где живёт код

- `scripts/seeds/minimal/` (тут) — README + (в будущем) ссылки на сопутствующие assets project-type'а.
- `src/cms/src/seed/minimal/` — реальные ts-скрипты, исполняются в cms workspace где доступен `payload` Local API.
- Корневая команда `pnpm seed:minimal` делегирует через `pnpm --filter cms run seed:minimal`.

## Другие project-types

`business-card`, `blog`, `portal` — placeholder'ы, см. `architecture_project_type_presets` в memory.
