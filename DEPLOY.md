# Развернуть сайт на Web Holy Grail

> **Читать целиком до первой команды.** Порядок шагов обязателен: половина шагов ломается, если
> предыдущий пропущен, и ломается не сразу, а через несколько минут деплоя.
>
> Подробности по каждому шагу — [`docs/whg/37-scaffolding.md`](docs/whg/37-scaffolding.md).
> Как устроены скрипты и workflow — [`docs/infra/scripts-and-workflows.md`](docs/infra/scripts-and-workflows.md).

## Что понадобится

| Что                                    | Где взять                                                 |
| -------------------------------------- | --------------------------------------------------------- |
| Админские креды Infisical              | `INFISICAL_ADMIN_CLIENT_ID` / `..._SECRET` / `..._ORG_ID` |
| Доступ к VPS по SSH                    | ключ пользователя `deploy`                                |
| `gh` с правами на создание репозитория | `gh auth status`                                          |

## Порядок

### 1. Выбрать PORT_BASE — до всего остального

Шаг между сайтами **+20**. Синий цвет занимает `PORT_BASE` и `PORT_BASE+1`, зелёный —
`PORT_BASE+100` и `+101`. То есть база 3060 занимает четыре порта: 3060, 3061, 3160, 3161.

```bash
ssh deploy@<vps> 'docker ps -a --format "{{.Names}} {{.Ports}}"'
```

Смотреть `docker ps -a`, а не список слушающих портов: неактивный цвет остановлен, но его база
занята. `deploy.sh` откажется стартовать при конфликте, но узнаете вы об этом через три минуты
сборки.

### 2. Репозиторий из шаблона

```bash
gh repo create <owner>/<slug> --template <owner>/WebHolyGrail --private --clone
cd <slug> && pnpm install
```

### 3. Доступ VPS к приватному репозиторию

Приватный репозиторий по HTTPS с сервера не клонируется. Нужен deploy-ключ и SSH-алиас:

```bash
ssh deploy@<vps> '
  ssh-keygen -q -t ed25519 -N "" -C "<slug>-deploy@vps" -f ~/.ssh/<slug>_deploy
  printf "\nHost github-<slug>\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/<slug>_deploy\n  IdentitiesOnly yes\n" >> ~/.ssh/config
  cat ~/.ssh/<slug>_deploy.pub'
gh repo deploy-key add <файл с ключом> --repo <owner>/<slug> --title vps-deploy
```

Проверка: `ssh deploy@<vps> 'ssh -T github-<slug>'` → «successfully authenticated».

### 4. Проект в Infisical

```bash
pnpm setup-infisical --site <slug>
```

**Без `--` перед флагами.** В документации местами написано `pnpm setup-infisical -- --site`, но
pnpm 11 передаёт `--` скрипту как позиционный аргумент, и он падает.

Скрипт печатает Client ID и Client Secret **один раз** — сохранить сразу.

### 5. Секреты прода

Ключ шифрования базы задаётся **до первого запуска** — тогда база создастся зашифрованной, и
конвертация с простоем не понадобится. Добавить ключ к уже работающей незашифрованной базе нельзя:
Payload её не откроет, деплой упадёт на миграциях.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # DATABASE_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # PAYLOAD_SECRET
```

Минимальный `.env.production` (в git не попадает, `.gitignore` содержит `.env.*`):

```
PAYLOAD_SECRET=            DATABASE_ENCRYPTION_KEY=
PAYLOAD_PUBLIC_SERVER_URL= NEXT_PUBLIC_SITE_URL=      NEXT_PUBLIC_CMS_URL=
PAYLOAD_ALLOWED_ORIGINS=   SITE_NAME=
ADMIN_INITIAL_EMAIL=       ADMIN_INITIAL_PASSWORD=
S3_BUCKET=                 S3_REGION=                 S3_ENDPOINT=
S3_PUBLIC_URL=             S3_ACCESS_KEY_ID=          S3_SECRET_ACCESS_KEY=
```

```bash
pnpm setup-infisical --site <slug> --from-env .env.production --env prod
```

### 6. Хранилище

При общем MinIO на сервере — создать бакет и открыть на чтение. Логин там **не** `minioadmin`,
берётся из окружения уже работающего сайта:

```bash
ssh deploy@<vps> '
  KEY=$(docker exec <другой-сайт>-cms-blue sh -c "printenv S3_ACCESS_KEY_ID")
  SEC=$(docker exec <другой-сайт>-cms-blue sh -c "printenv S3_SECRET_ACCESS_KEY")
  docker run --rm --network holygrail --entrypoint sh minio/mc:latest -c "
    mc alias set local http://minio:9000 \"$KEY\" \"$SEC\"
    mc mb local/<slug>-media
    mc anonymous set download local/<slug>-media"'
```

Сеть контейнера MinIO проверить заранее: `docker inspect minio --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}'`.

### 7. Переменные репозитория

```bash
pnpm setup-infisical --site <slug> --github \
  --vps-host <ip> --domain <domain> --port-base <из шага 1>
```

Заводит ключ CI, авторизует его на сервере, ставит `VPS_HOST`, `VPS_SSH_KEY`, `VPS_USER`,
`VPS_PATH`, `PUBLIC_URL`, `PRIMARY_DOMAIN`, `INFISICAL_HOST_URL`, `PORT_BASE` и переключает
права workflow на запись (без этого первый push в GHCR даёт 403).

### 8. Папка сайта на сервере

`deploy.sh` ожидает готовый git-репозиторий в `/opt/sites/<slug>`. Без этого шага деплой падает на
`cd: No such file or directory` — сборка при этом успевает пройти.

```bash
scp scripts/bootstrap-site-on-vps.sh deploy@<vps>:/tmp/
ssh deploy@<vps> '
  TOKEN=$(curl -sS -X POST "$INFISICAL_HOST/api/v1/auth/universal-auth/login" \
    -d "clientId=<admin-client-id>" -d "clientSecret=<admin-secret>" | jq -r .accessToken)
  SLUG=<slug> REPO=github-<slug>:<owner>/<slug>.git \
  INFISICAL_HOST_URL=$INFISICAL_HOST INFISICAL_ADMIN_TOKEN=$TOKEN \
  INFISICAL_ADMIN_ORG_ID=<org-id> /tmp/bootstrap-site-on-vps.sh'
```

`REPO` указывать через SSH-алиас из шага 3. Скрипт принимает только JWT — админские
Universal Auth креды меняются на токен логином, как показано выше.

При повторном запуске скрипт **не обновляет** `origin` у существующей папки. Если первый заход
был с HTTPS-адресом, поправить руками:
`git -C /opt/sites/<slug> remote set-url origin github-<slug>:<owner>/<slug>.git`

### 9. Деплой

```bash
git push origin main
```

Первый прогон — около 4 минут (сборка без кэша плюс выкладка). Повторные — 2–3 минуты.

### 10. Домен и сертификат

DNS на адрес сервера. Сертификат выпускается автоматически при деплое для тех доменов, которые уже
резолвятся; остальные подхватятся на следующем прогоне.

Проверить, что vhost получил TLS **на активном цвете**: раньше при зелёном деплое домен оставался
на http.

## Проверка после деплоя

```bash
curl -o /dev/null -w '%{http_code}\n' https://<domain>/
curl -o /dev/null -w '%{http_code}\n' https://<domain>/admin
ssh deploy@<vps> 'docker ps --format "{{.Names}} {{.Status}}" | grep <slug>'
```

Дальше — [смоук всего сайта](docs/whg/38-invariants.md): страницы, ссылки, формы, обе темы,
мобильная ширина и ландшафт, отсутствие внешних запросов.

## Известные грабли

| Симптом                                                      | Причина                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `Unexpected argument '--site'`                               | Лишний `--` перед флагами при вызове через pnpm 11                                 |
| `cd: /opt/sites/<slug>: No such file`                        | Пропущен шаг 8                                                                     |
| `could not read Username for 'https://github.com'`           | Приватный репозиторий без deploy-ключа, шаг 3                                      |
| `порт NNNN уже занят контейнером другого сайта`              | База конфликтует по правилу `+100` для зелёного                                    |
| 403 при push в GHCR                                          | Пакет с таким именем остался от удалённого репозитория — удалить пакет             |
| Деплой падает на миграциях после добавления ключа шифрования | Ключ добавлен к незашифрованной базе; сначала конвертация `scripts/encrypt-db.mjs` |
| Страница отдаёт 200, а раздел пустой                         | Смотреть ответ API, а не код страницы: `docker logs <slug>-cms-<color>`            |
