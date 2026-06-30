# Секреты — Infisical

> Источник правды для всех переменных окружения. `.env` в репозитории — НИКОГДА.

## Зачем

Хранилище секретов нужно **с первого коммита**, чтобы:

- деплой на VPS был тривиален (`infisical run -- docker compose up -d`);
- секреты не текли через `.env` файлы и dotfile-бэкапы;
- ротация ключей делалась в одном месте, не в десяти конфигах;
- разные окружения (dev/staging/prod) держались отдельно с одинаковыми ключами.

## Bootstrap (одной командой)

Скрипт `pnpm setup-infisical` создаёт project + envs + machine identity в self-host Infisical и пишет `.infisical.json` рядом с репо. Подробности — `whg-infisical` skill.

```bash
pnpm setup-infisical -- --site <slug>
```

После bootstrap:

```bash
infisical run --env=dev -- pnpm dev     # подтягивает dev-секреты в env-переменные
```

## На VPS

Universal Auth machine identity (client-id + client-secret) лежит в `/etc/infisical/<slug>/`:

Этим занимается `deploy/prod/deploy.sh` — login через UA → JWT → каждый `docker compose ...` оборачивается в `infisical run --token=$JWT --env=prod`, секреты летят в env контейнеров без записи на диск. См. `deploy/prod/README.md`.

## Правила работы

- **`.env` в git — НИКОГДА.** Если случайно коммитнул — force-remove из истории + ротация секрета **сразу**.
- **`.env.local.example`** — только шаблон с пустыми значениями, в git, актуальный.
- **Локально `.env.local`** для одноразового локального dev без Infisical (fallback) можно (gitignored).
- **Команды деплоя** всегда через `infisical run --`, не «забили в .env на проде».

## Проверка что секреты не утекли

```bash
# Какие ключи лежат в Infisical для окружения
infisical secrets --env=dev

# Запустить с экспортом в текущий shell (для отладки)
infisical export --env=dev --format=dotenv
```
