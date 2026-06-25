# Секреты — Infisical

> Источник правды для всех переменных окружения. `.env` в репозитории — НИКОГДА.

## Зачем

Хранилище секретов нужно **с первого коммита**, чтобы:

- деплой на VPS был тривиален (`infisical run -- docker compose up -d`);
- секреты не текли через `.env` файлы и dotfile-бэкапы;
- ротация ключей делалась в одном месте, не в десяти конфигах;
- разные окружения (dev/staging/prod) держались отдельно с одинаковыми ключами.

## Первый запуск (Windows)

```bash
# 1. Установка CLI (уже сделано через winget)
winget install infisical.infisical

# 2. Логин
infisical login

# 3. Привязка проекта (выполняется в корне репо)
cd /c/Users/<your-org>/Documents/ClaudeProjects/WebHolyGrail/sites/veo55
infisical init     # выбирает organization → project → env
# создаёт .infisical.json в текущей папке (gitignored)
```

После этого:

```bash
infisical run --env=dev -- pnpm dev     # подтягивает dev-секреты в env-переменные
```

## На VPS (Linux)

```bash
# 1. Установка
curl -1sLf 'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | sudo -E bash
sudo apt install -y infisical

# 2. Service token (machine identity, не пользовательский логин)
# Создать в Infisical Dashboard → Service Tokens → scope=prod, env=prod
export INFISICAL_TOKEN=st.xxxxxxxx...

# 3. Запуск
cd /opt/web-holy-grail
infisical run --env=prod --token=$INFISICAL_TOKEN -- docker compose -f sites/veo55/deploy/prod/docker-compose.yml up -d
```

## Правила работы

- **`.env` в git — НИКОГДА.** Если случайно коммитнул — force-remove из истории + ротация секрета **сразу**.
- **`.env.example`** — только шаблон с пустыми значениями, в git, актуальный.
- **Локально `.env.local`** для одноразовых экспериментов можно (gitignored), но не как основной способ.
- **Команды деплоя** всегда через `infisical run --`, не «забили в .env на проде».

## Проверка что секреты не утекли

```bash
# Какие ключи лежат в Infisical для окружения
infisical secrets --env=dev

# Запустить с экспортом в текущий shell (для отладки)
infisical export --env=dev --format=dotenv
```

## TODO к этому документу

- [ ] Дописать раздел про rotation ключей (Шаг 7).
- [ ] Описать как добавлять service-token на VPS через systemd-unit (Шаг 7).
- [ ] Описать восстановление если Infisical Cloud недоступен (offline fallback через зашифрованный backup-файл).
