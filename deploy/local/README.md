# Local stack — Docker Compose

`docker-compose.yml` поднимает **client** (Next 15 на 3000) и **cms** (Payload на 3001) в одной сети, с volume для SQLite и Media.

## Запуск

```bash
# Из корня монорепо
pnpm compose:up
# что то же самое:
infisical run --env=dev -- docker compose -f deploy/local/docker-compose.yml up -d
```

Остановка:

```bash
pnpm compose:down
```

Логи:

```bash
pnpm compose:logs
```

## Что внутри

| Сервис                  | Порт | Image из                | Volume                                                               |
| ----------------------- | ---- | ----------------------- | -------------------------------------------------------------------- |
| `cms` (veo55-cms)       | 3001 | `src/cms/Dockerfile`    | `veo55_db` (SQLite). Media → S3 (cdn.veo55.ru), локальной копии нет. |
| `client` (veo55-client) | 3000 | `src/client/Dockerfile` | —                                                                    |

Сеть `veo55-net` (bridge). Client ходит в cms через DNS-имя `cms:3001` (Docker DNS), не через `localhost`.

## Healthchecks

- **cms:** `GET /api/access` каждые 30с (после 60с start_period для первой компиляции Next).
- **client:** `GET /` каждые 30с. Зависит от `cms: service_healthy` — не запускается пока cms не ответит.

## Volumes

- `veo55_db` — `/data` внутри cms-контейнера, там лежит `veo55.db`.
- **Media НЕ монтируется.** `s3Storage` плагин в `payload.config.ts` выставляет `disableLocalStorage:true` — загруженные через админку файлы идут напрямую в S3 (bucket `veo55`, prefix `media/`), отдаются через `cdn.veo55.ru`. Места на сервере копии не занимают.

**Бэкап:** `docker run --rm -v veo55_db:/data -v $(pwd):/backup alpine tar czf /backup/veo55-db-$(date +%F).tar.gz -C /data .`

**Сброс БД** (опасно — удалит весь контент!):

```bash
pnpm compose:down
docker volume rm veo55_db
pnpm compose:up
```

## ENV

Compose ждёт что Infisical инжектит:

- `PAYLOAD_SECRET` — обязателен, иначе compose не стартует (`:?must be injected via infisical run`)
- `PAYLOAD_PUBLIC_SERVER_URL` (default `http://localhost:3001`)
- `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`)
- `DATABASE_URI` зафиксирован compose'ом на `file:/data/veo55.db` (внутренний путь в volume)
- `NEXT_PUBLIC_CMS_URL` для client зафиксирован на `http://cms:3001` (Docker DNS)

## Prod-вариант

Появится в `deploy/prod/` на Шаге 7 — там добавится nginx-reverse-proxy, TLS через Traefik / Caddy, и compose без `restart: unless-stopped` (а через systemd-unit на VPS).
