# `scripts/` — обслуживание инстансов и секретов

Скрипты уровня репозитория: поднять новый сайт, наполнить секреты, подтянуть шаблон. Ничего из этого не запускается в рантайме приложения.

Полная документация — [`docs/infra/scripts-and-workflows.md`](../docs/infra/scripts-and-workflows.md): что во что вызывает, порядок запуска, troubleshooting. Пользовательский гайд по созданию инстанса — [`docs/whg/37-scaffolding.md`](../docs/whg/37-scaffolding.md).

| Файл                       | Где запускается | Зачем                                                                                        |
| -------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| `bootstrap-site-on-vps.sh` | на VPS          | клон в `/opt/sites/<slug>`, Infisical project, UA identity, креды в `/etc/infisical/<slug>/` |
| `setup-infisical.ts`       | dev-машина      | project + envs + identity, и **значения** секретов через `--from-env`                        |
| `sync-infisical.ts`        | dev-машина      | сверить/перенести секреты между окружениями                                                  |
| `infisical-template.ts`    | —               | список стандартных ключей, общий для скриптов выше                                           |
| `sync-template.mjs`        | dev-машина      | обновить инстанс из upstream WHG (whitelist, `--dry-run`)                                    |
| `sync-template.sh`         | dev-машина      | обёртка над `.mjs`                                                                           |
| `seeds/`                   | dev / деплой    | пресеты стартового контента (`minimal`, `whg-landing`)                                       |

Два шага, без которых автодеплой нового инстанса не поднимется:

```bash
# 1. значения prod-секретов (scaffold создаёт только пустые placeholder'ы)
pnpm setup-infisical -- --site <slug> --from-env .env.production --env prod

# 2. vars/secrets репозитория — GitHub не копирует их из template-репо
#    полный список команд: docs/infra/scripts-and-workflows.md, «Сценарий A», шаг 7
gh variable list && gh secret list   # обе команды должны выдать непустой список
```

Скрипты в `scripts/` должны оставаться исполняемыми (`100755`). На Windows git пишет новый файл как `100644`, и деплой падает с `exit 126` уже после успешного билда — `sync-template.mjs` восстанавливает бит сам.
