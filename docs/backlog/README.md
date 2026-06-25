# Backlog

Backlog как процесс:

- **GitHub Issues** — основной список задач (открытые + закрытые). Labels: `bug` / `feat` / `chore`, priority (`priority:high|med|low`), area (`area:infisical|payload|deploy|...`).
- **`docs/backlog/findings/<issue-N>-<slug>.md`** — длинные технические notes по конкретной issue: curl outputs, stack traces, design decisions, исследования. Линкуется обратно на issue. Один файл per issue when needed (не каждой issue нужен).
- **PLAN.md** в MCP memory (`HolyGrail/plan/plan`) — короткая цепочка текущих задач (`1. #N → 2. #M → 3. #K`), активный фокус. **Не** дублирует issues.

## Workflow

1. Новая задача → создать issue (`gh issue create --template bug.yml`)
2. В работе → добавить в PLAN.md как next step в chain
3. Технические findings по ходу → `docs/backlog/findings/<N>-<slug>.md`, линк из issue
4. Done → close issue (через `Closes #N` в commit/PR)

## Labels конвенция

- **Тип:** `bug` / `feat` / `chore` / `docs`
- **Приоритет:** `priority:high` / `priority:med` / `priority:low`
- **Область:** `area:infisical` / `area:payload` / `area:deploy` / `area:scaffold` / `area:nginx` / `area:dx`
- **Состояние:** `status:blocked` / `status:in-progress` / `good-first-issue`

## Шаблоны

`.github/ISSUE_TEMPLATE/` — `bug.yml`, `feat.yml`, `chore.yml`. Открыть через github.com/Vovanda/WebHolyGrail/issues/new/choose.
