---
name: whg-scaffold
description: End-to-end workflow создания нового Holy Grail инстанса с нуля — gh repo create --template → pnpm setup-infisical → ./dev-setup.sh → ./dev.sh. От пустого GH-репозитория до работающего локального dev стека за 5-10 минут. Покрывает все шаги, грабли и smoke-проверки. Триггерить когда создаёшь новый сайт (любой ниши — блог, кафе, клиника, business, авто), тестируешь template ("Use this template" → работает за минуты), onboarding нового разработчика на WHG, или когда нужно пройти полный путь от создания репо до запуска dev.
---

# Skill: whg-scaffold

> Zero-config scaffolding нового Holy Grail инстанса. 5-10 минут от `gh repo create` до работающего dev стека.
>
> **Human-readable source of truth:** [`docs/whg/37-scaffolding.md`](../../../docs/whg/37-scaffolding.md). Этот skill — рабочая компактная версия для агента; держим их симметричными. Если хочешь обновить процесс — правь оба, оставляя cross-references.

## Когда триггерить

- Создание нового сайта (любой ниши — блог, кафе, клиника, business, авто, школа)
- instance admin говорит "scaffold <slug-b>" / "начни blog/clinic/cafe на WHG"
- Тестирование template — проверка что "Use this template" → работающий dev за минуты
- Onboarding нового разработчика на WHG architecture
- Воспроизведение чужого Holy Grail инстанса с нуля (debugging "почему у меня не стартует")

## Prereqs на машине разработчика (один раз)

| Tool          | Версия     | Проверка                                            |
| ------------- | ---------- | --------------------------------------------------- |
| Docker        | 24+        | `docker --version` (нужен для MinIO)                |
| pnpm          | 11.8+      | `pnpm --version`                                    |
| Node          | 20.11+ LTS | `node --version`                                    |
| Infisical CLI | latest     | `infisical --version`, и `infisical login` один раз |
| gh CLI        | 2.40+      | `gh --version`, и `gh auth status`                  |

Если что-то не установлено — см. соответствующий install (Infisical: `brew install infisical/get-cli/infisical` / `winget install Infisical.CLI` / curl-script).

## End-to-end workflow

### 1. Создать GH-репозиторий из template

```bash
gh repo create <owner>/<slug> --template Vovanda/WebHolyGrail --private --clone
cd <slug>
```

`<slug>` — короткое имя сайта (например `<slug-b>`, `clinic-vita`, `cafe-zerno`). Используется как Infisical project name, docker network namespace.

**Visibility — всегда `--private`.** Holy Grail инстансы — коммерческие сайты клиентов с domain-логикой / контентом / инфра-ссылками, которые не должны попадать в публичный доступ. Open-source / demo — явное исключение, только по прямой команде instance admin.

После клона: проверь `git remote -v` указывает на свой репо (а не WHG).

### 2. Установить зависимости

```bash
corepack enable          # если pnpm ещё не активирован через corepack
pnpm install
```

Должно резолвить 800+ пакетов за ~15-30 сек. Если падает на peer-deps — `pnpm install --shamefully-hoist` (последнее средство, обычно не нужно).

### 3. Bootstrap Infisical project

```bash
infisical login          # один раз глобально, токен в keychain (если ещё нет)
pnpm setup-infisical -- --site <slug>
```

Что делает `pnpm setup-infisical`:

- `createProject({ projectName: "holygrail-<slug>", type: "secret-manager" })`
- `createEnvironment` × 3 (dev / staging / prod)
- Seed placeholders для STANDARD*SECRETS (PAYLOAD*_, DATABASE*URI, S3*_, NEXT*PUBLIC*\_, VK\_\_)
- Пишет `.infisical.json` в корень (`workspaceId` + `defaultEnvironment: "dev"`)

`.infisical.json` — **коммитится** (там только UUID workspace'а, не секреты).

Если падает — см. секцию "Грабли" ниже.

### 4. dev-setup (MinIO + secrets defaults)

```bash
./dev-setup.sh
```

Что делает:

- Проверяет infisical CLI / docker / .infisical.json — fail-fast если что-то не так
- `infisical init` если ещё не было — линкует папку к проекту
- Поднимает MinIO docker контейнер (`holygrail-minio`) + bucket `local-media` через `mc` init-контейнер
- Сетит дефолты в Infisical **dev env** через `infisical secrets set` (NO-OP если уже заданы):
  - `PAYLOAD_SECRET` → сгенерированный 32-byte hex
  - `DATABASE_URI` → `file:./data/site.db`
  - `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_SITE_URL`, `PAYLOAD_PUBLIC_SERVER_URL` → localhost
  - `S3_BUCKET=local-media`, `S3_ENDPOINT=http://localhost:9000`, `S3_REGION=us-east-1`
  - `S3_ACCESS_KEY_ID=minioadmin`, `S3_SECRET_ACCESS_KEY=minioadmin`
  - `S3_PUBLIC_URL=http://localhost:9000/local-media`

После: проверить в Infisical UI (https://app.infisical.com/) что все секреты появились в dev env.

### 5. Запуск dev-стека

```bash
./dev.sh
```

Что происходит:

- Pre-check `.infisical.json` существует, MinIO запущен (если нет — поднимает)
- `infisical run --env=dev --recursive --` инжектит все dev-секреты в env
- `concurrently` запускает CMS (Payload :3001) + Client (Next :3000)

При первом запуске:

- CMS делает migrations (если есть)
- Создаётся SQLite файл `src/cms/data/site.db`
- Должен открыться `http://localhost:3001/admin` → "Create first user" страница

### 6. Создать первого Payload админа

В браузере: `http://localhost:3001/admin` → форма создания первого юзера → email + пароль.

После создания → попадаешь в админку. Должны быть видны коллекции: Pages, Media, Users, FormSubmissions, ReusableBlocks, Posts, Comments, FaqGroups + global SiteSettings.

### 7. Настроить SiteSettings

Globals → SiteSettings → заполнить:

- `siteName` (отображается в `<title>`, header)
- `description` (используется в meta + footer)
- `mainNav` — главное меню (массив `{label, href, external?}`)
- `contacts` — email/phone/address
- `socials` — VK/Telegram/Instagram ссылки
- `layout` — выбрать preset (см. `whg-layouts` skill)

### 8. Создать главную страницу

Pages → Create → slug = `home`, status = `published`, blocks = [Hero, Quote, Timeline, ...].

После save → `http://localhost:3000/` показывает home page.

## Production-готовность (когда нужно деплоить)

### 1. Machine Identity для prod-деплоя

В Infisical UI:

1. Project `holygrail-<slug>` → Access Control → Machine Identities → Create
2. Name: `<slug>-prod-deploy`, Type: Universal Auth
3. Привязать к environment `prod`, scope `Read`
4. Сгенерировать Client ID + Client Secret (показывается один раз — скопировать)

### 2. Setup VPS

```bash
ssh deploy@<vps-host>
# Install Infisical CLI
curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' | sh

# Положить client credentials
sudo install -d -m 700 -o deploy -g deploy /etc/infisical
echo "<client-id>" | sudo tee /etc/infisical/client-id > /dev/null
echo "<client-secret>" | sudo tee /etc/infisical/client-secret > /dev/null
sudo chmod 600 /etc/infisical/*
sudo chown deploy:deploy /etc/infisical/*
```

### 3. Заполнить prod-секреты

В Infisical UI → prod environment → заполнить **real** значения:

- `PAYLOAD_SECRET` — production 32-byte hex (НЕ тот что в dev)
- `DATABASE_URI` — для prod (Postgres URL или путь к SQLite на VPS volume)
- `S3_*` — **real** cloud bucket (Backblaze B2 / Cloudflare R2 / AWS / Yandex Cloud / VK Cloud)
- `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_SITE_URL` → prod-домены
- `PAYLOAD_ALLOWED_ORIGINS` → CSV прод-доменов

### 4. Первый деплой

В GH Actions / вручную через SSH:

```bash
bash deploy/prod/deploy.sh <git-sha>
```

`deploy.sh` обёрнут в `infisical run --token=$(cat /etc/infisical/...) --env=prod --` — secrets инжектятся в docker compose.

## Smoke-проверки

После `./dev.sh`:

- [ ] `http://localhost:3000/` → "Страница «home» создана, но блоки ещё не добавлены" (если home Page ещё нет) или валидная главная
- [ ] `http://localhost:3001/admin` → админка открывается
- [ ] `http://localhost:3000/api/health` → JSON со sha
- [ ] `http://localhost:9001/` → MinIO web console (minioadmin/minioadmin), bucket `local-media` существует
- [ ] Загрузить картинку в Media → она появляется в MinIO bucket
- [ ] В Pages создать тестовую страницу → она доступна по slug

## Грабли (заполнять по мере)

> Обновляется после каждого реального scaffold'а. Если попал в грабли которой здесь нет — добавь.

### `pnpm setup-infisical` падает на createProject

- **Симптом:** `Forbidden` или `Project name already exists`.
- **Причина:** project уже создан в этой org (предыдущий запуск или ручное создание).
- **Решение:** В Infisical UI удалить проект `holygrail-<slug>` или взять существующий через `infisical init`.

### `infisical login` не открывает браузер на Windows

- **Симптом:** Команда зависает.
- **Решение:** `infisical login --domain=https://app.infisical.com` явно, или использовать device-code flow.

### MinIO не поднимается

- **Симптом:** `docker compose --profile minio up` падает с "port 9000 already in use".
- **Причина:** Что-то ещё держит порт 9000 (другой MinIO instance, другой S3-emulator).
- **Решение:** `lsof -i :9000` (Mac/Linux) / `netstat -ano | findstr :9000` (Windows) → kill процесс.

### Payload падает на старте: "Missing required env S3_BUCKET"

- **Причина:** `dev-setup.sh` не отработал, S3\_\* пустые в Infisical dev env.
- **Решение:** Перезапустить `./dev-setup.sh` или вручную проверить через Infisical UI / `infisical secrets list --env=dev`.

### Первый запуск долгий (CMS не отвечает)

- **Норма:** при первом запуске Payload генерит admin bundle, делает migrations, готовит SQLite. Может занять 30-60 секунд.
- **Если >2 минут:** посмотри логи в терминале — там либо стек ошибки, либо ещё что-то билдится.

### Build падает в CI с peer-deps warnings

- **Норма:** WHG использует caret-ranges; некоторые peer-deps warnings приемлемы.
- **Если ломает CI:** `pnpm install --strict-peer-dependencies=false` или fix в `package.json` overrides.

## Что ускорить в будущем

- **Один-команда CLI** — обёртка над всеми шагами выше: `npx create-holygrail-site <slug>`. Сейчас разнесено по 5 командам.
- **Pre-seeded SiteSettings** — `setup-infisical` могло бы сразу создавать SiteSettings global с дефолтами через Payload REST.
- **Pre-seeded home Page** — пустая страница с slug `home` чтобы `http://localhost:3000/` не показывал 404.
- **GitHub Action template** — `.github/workflows/deploy.yml` уже там, но требует ручного setting'а SSH ключей. Можно автоматизировать через `gh secret set`.

## Связанные skills

- **whg-infisical** — детали Infisical setup, ротация секретов, debug "secret not found"
- **whg-template-sync** — sync обновлений из upstream WHG в инстанс
- **payload-migration** — миграции схемы Payload при изменении collections
- **whg-rules** — R0-R15 архитектурные правила
- **whg-layouts** — SiteSettings.layout config (panels/slots)

## Human-readable версия

[`docs/whg/37-scaffolding.md`](../../../docs/whg/37-scaffolding.md) — то же самое для пользователя без агента. Source of truth — там; этот skill = его проекция для агента.

При апдейте: правь оба синхронно. Если правишь только skill — это техдолг, добавь TODO в 37-scaffolding.md.
