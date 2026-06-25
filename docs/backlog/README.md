# Backlog

Backlog как процесс:

- **GitHub Issues** — публичный список задач (открытые + закрытые). Labels: `bug` / `feat` / `chore`, priority (`priority:high|med|low`), area (`area:infisical|payload|deploy|...`).
- **`docs/backlog/findings/<issue-N>-<slug>.md`** — длинные технические notes по конкретной issue: curl outputs, stack traces, design decisions, исследования. Линкуется обратно на issue. Один файл per issue when needed (не каждой issue нужен).

> Внутренние AI-артефакты (порядок задач в цепочке, mid-task state) живут в MCP memory и не публикуются — это AI session state, не для пользователей template'а.

## Workflow

1. Новая задача → создать issue (`gh issue create --template bug.yml`)
2. Технические findings по ходу → `docs/backlog/findings/<N>-<slug>.md`, линк из issue
3. Done → close issue (через `Closes #N` в commit/PR — auto-close)

## Labels конвенция

- **Тип:** `bug` / `feat` / `chore` / `docs`
- **Приоритет:** `priority:high` / `priority:med` / `priority:low`
- **Область:** `area:infisical` / `area:payload` / `area:deploy` / `area:scaffold` / `area:nginx` / `area:dx`
- **Состояние:** `status:blocked` / `status:in-progress` / `good-first-issue`

## Шаблоны

`.github/ISSUE_TEMPLATE/` — `bug.yml`, `feat.yml`, `chore.yml`. Открыть через github.com/Vovanda/WebHolyGrail/issues/new/choose.
