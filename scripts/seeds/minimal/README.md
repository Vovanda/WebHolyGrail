# Seed: minimal

Минимальный project-type preset для нового Holy Grail сайта.

## Что создаёт

- **Initial admin user** — `Users.role=admin`, email из `SEED_ADMIN_EMAIL`, пароль из `SEED_ADMIN_PASSWORD`.
- **Home page** — пустая `Pages` запись, `slug=home`, `_status=published`, без блоков.

Идемпотентно: повторный запуск не дублирует, существующие записи не трогает.

## Запуск

```bash
# из корня репо
SEED_ADMIN_EMAIL=admin@example.com \
SEED_ADMIN_PASSWORD="$(openssl rand -hex 16)" \
pnpm seed:minimal
```

Требуется уже поднятый CMS workspace (`./dev.sh` или `pnpm --filter cms run dev`), потому что seed использует Payload Local API и нуждается в инициализированной БД.

## Где живёт код

- `scripts/seeds/minimal/` (тут) — README + (в будущем) ссылки на сопутствующие assets project-type'а.
- `src/cms/src/seed/minimal/` — реальные ts-скрипты, исполняются в cms workspace где доступен `payload` Local API.
- Корневая команда `pnpm seed:minimal` делегирует через `pnpm --filter cms run seed:minimal`.

## Другие project-types

`business-card`, `blog`, `portal` — placeholder'ы, см. `architecture_project_type_presets` в memory.
