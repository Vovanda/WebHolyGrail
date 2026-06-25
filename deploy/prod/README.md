# veo55 — production deployment

Стек: Payload CMS (3001) + Next 15 client (3000) + nginx reverse-proxy + certbot.
БД: SQLite (volume `veo55_db`).
Media: VK Object Storage (S3-совместимое).

## Первый деплой

### 0. Подготовка VPS

```bash
# Любой Ubuntu 22.04+ / Debian 12 c минимум 2 GB RAM, 20 GB SSD.
apt update && apt install -y curl ca-certificates rsync

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Infisical CLI (для секретов)
curl -fsSL https://artifacts-cli.infisical.com/install.sh | sh

# DNS: A-запись @ и www → IP VPS (ждать TTL'а провайдера 5-60 мин)
dig +short veo55.ru
```

### 1. Initial sync

С локальной машины:

```bash
# rsync кода (без node_modules, без data)
VPS_HOST=root@veo55.ru ./deploy/prod/deploy.sh
```

### 2. Setup Infisical (на сервере)

```bash
ssh root@veo55.ru
cd /srv/veo55

# Логин в Infisical Cloud (откроет браузер на dev-машине)
infisical login

# Связать с проектом
infisical init   # выбрать workspace «veo55»

# Заполнить секреты (один раз) — список из .env.production.example
# Делается через web-UI infisical.com или CLI:
infisical secrets set PAYLOAD_SECRET=$(openssl rand -hex 32) --env=prod
infisical secrets set S3_ACCESS_KEY_ID=... --env=prod
# … остальные
```

**Альтернатива** — без Infisical, через `.env.production`:

```bash
cp deploy/prod/.env.production.example \
   deploy/prod/.env.production
nano deploy/prod/.env.production   # заполнить все
```

### 3. Получить TLS-сертификаты (certbot)

```bash
# Запустить только nginx (без TLS пока — слушает :80 для http-01 challenge)
docker compose -f deploy/prod/docker-compose.yml up -d nginx
# nginx сейчас упадёт потому что conf.d/veo55.conf требует cert. Временно
# закомментировать `listen 443 ssl` блок до получения сертификата.

# Запросить сертификат через certbot контейнер (one-shot):
docker run --rm -it \
  -v veo55_certbot_www:/var/www/certbot \
  -v veo55_certbot_certs:/etc/letsencrypt \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d veo55.ru -d www.veo55.ru \
  --email mail@veo55.ru --agree-tos --no-eff-email

# Раскомментировать `listen 443 ssl` в conf.d/veo55.conf
docker compose -f deploy/prod/docker-compose.yml restart nginx
```

Certbot контейнер из стека потом будет автоматически продлевать раз в 12 ч (см. `docker-compose.yml` → `certbot` service).

### 4. Запустить весь стек

```bash
# Вариант A — через Infisical (рекомендуется):
cd /srv/veo55
infisical run --env=prod -- docker compose \
  -f deploy/prod/docker-compose.yml up -d --build

# Вариант B — через .env.production файл:
docker compose --env-file deploy/prod/.env.production \
  -f deploy/prod/docker-compose.yml up -d --build

# Применить миграции БД
docker exec veo55-cms pnpm --filter veo55-cms migrate

# Smoke
curl -I https://veo55.ru/
curl -I https://veo55.ru/admin
```

### 5. Bootstrap admin user

При первом запуске Payload создаёт первого админ-юзера если коллекция `users` пуста — используя `ADMIN_INITIAL_EMAIL` и `ADMIN_INITIAL_PASSWORD` из env. После входа поменять пароль в `/admin/account`.

### 6. Sync контента (первый раз)

```bash
# Sync VK-постов (50 свежих + комменты)
docker exec veo55-cms pnpm --filter veo55-cms sync:vk-posts 50

# Импорт родословной из РКФ для всех Dogs с rkfId
docker exec veo55-cms pnpm --filter veo55-cms seed:fetch-pedigree
```

Далее **синхронизация автоматическая** через Payload Jobs Queue:

- `sync-vk-posts` каждые 15 мин (off-minutes :07/:22/:37/:52)
- `fetch-pedigree` раз в неделю (вс 04:13)
- runner (`autoRun`) проверяет queue каждую минуту

Видно в админке `/admin/collections/payload-jobs` (группа «Лента») — статус, retries, output, error.

## Регулярные деплои

```bash
VPS_HOST=root@veo55.ru ./deploy/prod/deploy.sh
```

Скрипт:

1. `rsync` свежий код
2. `docker compose up -d --build` (новые образы)
3. `pnpm migrate` (применить новые миграции)
4. Smoke: статус-коды `/`, `/admin`, `/api/access`

## Откат

```bash
ssh root@veo55.ru
cd /srv/veo55

# Posts/comments/media — в БД и S3, не страдают от rsync.
# Код — git history.
git log --oneline -5
git checkout <commit-sha>

# Применить старые миграции (если есть down)
docker compose -f deploy/prod/docker-compose.yml restart cms
docker exec veo55-cms pnpm --filter veo55-cms migrate
```

## Backup БД и Media

```bash
# SQLite — один файл, копируем
ssh root@veo55.ru "docker run --rm -v veo55_db:/data alpine \
  tar czf - /data" > backup-$(date +%Y%m%d).tar.gz

# Media — в S3, бэкапит провайдер (VK Cloud), но можно дополнительно:
# (TODO: rclone sync s3://veo55 ./backup/media/)
```

## Troubleshooting

| Симптом                                         | Причина                   | Решение                                                                                         |
| ----------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `502 Bad Gateway` от nginx                      | client / cms не поднялись | `docker compose logs cms client`                                                                |
| `cms` падает на старте — `no such table: posts` | миграции не применены     | `docker exec veo55-cms pnpm --filter veo55-cms migrate`                                         |
| `sync:vk-posts` 401 / 5xx                       | VK token истёк            | сгенерить новый через vk.com/dev (это service token, бессрочный — обычно проблема в rate-limit) |
| Лента не обновляется автоматически              | runner упал               | `docker exec veo55-cms ps` — проверить process, рестарт `docker compose restart cms`            |
| Сертификат истёк                                | certbot не renewнул       | `docker logs veo55-certbot` — проверить, ручной renew `docker exec veo55-certbot certbot renew` |

## TODO до полного прод-ready

- [ ] Замена SQLite → Postgres (когда трафик пойдёт). См. `holy-grail/reference/security-sqlite-todo`.
- [ ] Backup в облако через rclone / Yandex Object Storage.
- [ ] Monitoring (Prometheus + Grafana или Uptime Kuma как минимум).
- [ ] Логирование наружу (Loki / Datadog).
- [ ] CI/CD GitHub Actions: build → push registry → SSH deploy (вместо local rsync + build).
