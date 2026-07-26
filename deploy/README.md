# `deploy/` — compose-файлы и инфраструктура

Четыре независимых стека. Прод-сайт и общая инфраструктура (nginx, Infisical) живут отдельно: сайты приходят и уходят, прокси и хранилище секретов стоят.

Полная документация — [`docs/infra/scripts-and-workflows.md`](../docs/infra/scripts-and-workflows.md).

| Папка          | Что поднимает                                       | README                                         |
| -------------- | --------------------------------------------------- | ---------------------------------------------- |
| `prod/`        | сам сайт: blue-green через GH Actions               | [prod/README.md](prod/README.md)               |
| `local/`       | dev-стек: Postgres/SQLite + MinIO                   | [local/README.md](local/README.md)             |
| `proxy-stack/` | nginx + Let's Encrypt, общий для всех сайтов на VPS | [proxy-stack/README.md](proxy-stack/README.md) |
| `infisical/`   | self-host Infisical: Postgres + Redis + API         | [infisical/README.md](infisical/README.md)     |

Регулярный деплой — это `git push origin main`, всё остальное делает [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml): build → GHCR → ssh → `prod/deploy.sh` → переключение nginx.

Для нового инстанса перед первым пушем — значения секретов в Infisical и vars/secrets репозитория: [prod/README.md](prod/README.md).
