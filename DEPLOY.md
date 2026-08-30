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

## Копии базы

База сайта живёт одним файлом на диске, и всё, что владелец набрал руками, существует
в единственном экземпляре. Снимок ставится один раз и дальше снимается сам.

Снимаем через `VACUUM INTO`: он делает целую копию на ходу, не останавливая сайт.
Простое копирование файла такой гарантии не даёт - рядом лежит журнал, и копия без
него бесполезна.

```bash
# на хосте, от имени пользователя деплоя
sudo apt-get install -y sqlite3
sudo mkdir -p /opt/backups/db && sudo chown "$USER":"$USER" /opt/backups/db

sqlite3 /opt/sites/<slug>/src/cms/data/<slug>.db   "VACUUM INTO '/opt/backups/db/<slug>-$(date +%Y%m%d).db'"
```

Дальше это заворачивается в службу и таймер systemd - ежедневно, с разбросом по времени
и хранением в две недели. Готовые файлы: `holygrail-db-backup.service` и `.timer` рядом
со скриптом обхода всех сайтов хоста.

**Проверять надо не наличие файла, а восстановление.** Распакуйте свежий снимок в сторону
и спросите у него `PRAGMA integrity_check` и число записей в паре таблиц - иначе копия
годится только для спокойствия.

**Зашифрованную базу снаружи не снять.** Если у сайта задан `DATABASE_ENCRYPTION_KEY`,
внешний `sqlite3` файл не откроет - ключ знает только сам сайт. Снимок для неё делает он же:

```bash
docker exec <slug>-cms-<цвет> sh -c 'pnpm --filter cms backup:db /tmp/snap.db'
docker cp <slug>-cms-<цвет>:/tmp/snap.db.enc /opt/backups/db/<slug>-$(date +%Y%m%d).db.enc
docker exec <slug>-cms-<цвет> sh -c 'rm -f /tmp/snap.db*'
```

Такой снимок закрыт тем же ключом: открытая копия рядом с закрытой базой свела бы
шифрование на нет. Разворачивается он командой сайта - `pnpm --filter cms open:backup
<файл>.enc <куда>`; чужой ключ даёт отказ, а не половину базы.

**Снимок рядом с базой - половина дела.** Он спасает от ошибки в админке и неудачной
миграции, но не от потери машины. Копию нужно уносить с хоста: во внешнее хранилище,
на второй сервер или к себе.

## Перевод базы под ключ

База может лежать открытой или закрытой ключом. Закрытая не читается ничем, кроме
самого сайта: утёкший дамп в этом случае - набор байт, а не содержимое. Ключ
задаётся при открытии, поэтому зашифровать файл на месте нельзя - база
пересоздаётся.

**Порядок на живой машине.** Сайт держит базу открытой, поэтому первым делом он
останавливается - иначе половина правок останется в старом файле.

```bash
# 1. остановить CMS - обе стороны, если развёрнуты цветами.
#    Имя контейнера собирается из slug и цвета, поэтому останавливаем по имени,
#    а не службой compose: у неё имя другое (cms) и нужны переменные окружения.
docker stop <slug>-cms-blue <slug>-cms-green 2>/dev/null

# 2. снять копию - до всякого перевода
cp /opt/sites/<slug>/src/cms/data/<slug>.db /opt/backups/db/<slug>-before-encrypt.db

# 3. перевести (ключ придумывается заранее и кладётся в Infisical)
cd /opt/sites/<slug> && DATABASE_ENCRYPTION_KEY='<ключ>'   pnpm --filter cms encrypt:db src/cms/data/<slug>.db src/cms/data/<slug>.enc.db

# 4. поставить закрытую на место прежней
mv src/cms/data/<slug>.enc.db src/cms/data/<slug>.db

# 5. положить ключ в окружение сайта и поднять его обратно
```

Проверять после подъёма: админка открывается, страницы отдают 200, в списке медиа
видно записи. Пока это не проверено, копию из шага 2 не удалять.

**Потеря ключа - потеря базы.** Без него файл не открывается ни сайтом, ни
инструментами: в этом и смысл. Ключ живёт в Infisical рядом с прочими секретами
инстанса, и снимать его оттуда «на время» не нужно.

**Обратный ход есть.** Если шифрование оказалось лишним, база открывается тем же
способом:

```bash
DATABASE_ENCRYPTION_KEY='<ключ>'   pnpm --filter cms encrypt:db --open src/cms/data/<slug>.db src/cms/data/<slug>.plain.db
```

**Снимок закрытой базы делает сам сайт** (см. предыдущий раздел): внешний `sqlite3`
её не откроет, а `VACUUM INTO` дал бы открытую копию рядом с закрытой базой - это
свело бы шифрование на нет.

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
