# cms — Payload 3.x

Отдельное Next 15 приложение под Payload-админку и REST/GraphQL API. Не имеет публичных страниц — фронт сайта живёт в `../client`.

## Состав

| Компонент                  | Файл                                                                     |
| -------------------------- | ------------------------------------------------------------------------ |
| Конфиг Payload             | `src/payload.config.ts`                                                  |
| Next config (withPayload)  | `next.config.mjs`                                                        |
| Коллекции                  | `src/collections/Users.ts`, `Media.ts`, `Pages.ts`, `FormSubmissions.ts` |
| Глобалы                    | `src/globals/SiteSettings.ts`                                            |
| App Router (Payload pages) | `src/app/(payload)/`                                                     |
| Dockerfile                 | `Dockerfile` (multi-stage, Alpine)                                       |

## Стек

- **Payload 3.x** + `@payloadcms/db-sqlite` + `@payloadcms/richtext-lexical`
- **Next 15** + React 19 (требование Payload 3.x peerDep)
- **sharp** для обработки картинок при upload в Media
- **i18n: ru** (через `@payloadcms/translations`)

## Запуск (локально)

```bash
# Из корня монорепо
pnpm --filter cms dev
# → Payload админка: http://localhost:3001/admin
# → API: http://localhost:3001/api
```

При первом запуске Payload предложит создать первого admin-пользователя через UI (или используется `ADMIN_INITIAL_EMAIL`/`ADMIN_INITIAL_PASSWORD` через seed).

## Переменные окружения

Полный список — `../../.env.local.example`. Минимум для запуска:

- `PAYLOAD_SECRET` (≥32 символа)
- `DATABASE_URI` (`file:./data/${SITE_SLUG}.db` для локалки)
- `PAYLOAD_PUBLIC_SERVER_URL`

## Принципы

- **Не лезть в БД в обход Payload Local API** (R8) — Payload и есть слой доступа.
- **`Pages.blocks` пуст** до тех пор пока конкретные блоки не появятся (R9).
- **Admin на русском** — `i18n.fallbackLanguage: 'ru'`. Если где-то увидите английский — это либо имя поля без `label`, либо имя коллекции без `labels.singular/plural`. Чините.
- **Доступы** в коллекциях через функции `access` — не выключать. Публикация формы без авторизации (`create: () => true` для FormSubmissions) — единственное публичное действие.
