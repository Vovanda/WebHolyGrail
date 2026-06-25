<!-- mcp-project: HolyGrail -->

# Agent instructions

> Этот проект — сайт на базе **Web Holy Grail** (Next 15 + Payload 3 + contracts seam + Docker + Infisical). Гибкая архитектура: сайт растёт вместе с бизнесом через `blocks/domain/<niche>/` + новые collections + routes — без переписывания. Описание самого проекта (что за сайт, что он делает) — в [`README.md`](README.md). Архитектурная документация — в [`docs/whg/`](docs/whg/).

## При старте сессии

Прежде чем что-то делать — **детект, на чём ты находишься**:

```bash
# 1. Имя репо (приоритет если git remote есть):
gh repo view --json name 2>/dev/null | jq -r .name
# или из git remote:
basename -s .git "$(git remote get-url origin 2>/dev/null)"
# fallback — basename корневой папки:
basename "$(pwd)"
```

Дальше:

- **Если имя ∈ `{WebHolyGrail, web-holy-grail}`** — это **upstream template**. README описывает framework, активны maintainer-правила (см. внизу).
- **Если имя что-то другое** (например `sawking-tech`, `cafe-zerno`, `clinic-vita`) — это **downstream instance**. README, склонированный из template, скорее всего описывает framework, не этот конкретный сайт. **Проактивно** в первом ответе предложи:
  > «Этот репо называется `<name>`. README пока описывает Web Holy Grail. Если этот сайт не WHG, расскажи в одной фразе чем он занимается, и я обновлю README + CLAUDE-секцию под него.»
  > Не lecture, не настойчиво — одно предложение, ждёшь ответа. Если пользователь скажет «не сейчас» / проигнорирует — продолжай работу как обычно.
- **Если есть `.template-version` в корне** — это однозначный маркер инстанса (после `sync-template.sh`).

## Принципы (R0–R15 кратко)

Полный список — [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md). Самое важное:

- **R0** — Контент в БД (Payload), не в коде. Меняется без deploy.
- **R3** — `client/` ↔ `cms/` только через `contracts/`. Никаких прямых импортов.
- **R4** — Side-scaling. Новая фича = новый `blocks/domain/<niche>/` + collections + routes в этом же репо.
- **R5++** — Именование функциональное (`EntityCard`, не `DogCard`).
- **R9** — Обобщение снизу вверх (не делать generic-`Card` до 2-3 живых niche-карточек).
- **R14** — SSR по умолчанию. `'use client'` только для DOM/browser API.

Перед архитектурным выбором — активируй skill `whg-rules`.

## Где что живёт

Граница проводится по **кто меняет**, не по типу данных:

| Кто меняет                                         | Где                                         | Что туда уходит                                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content manager** (через UI без разработчика)    | Payload `SiteSettings` global + collections | siteName, контакты, mainNav, footer links, theme/palette name, бренд, доменные сущности (Posts, Products, Customers, …)                                  |
| **Разработчик / DevOps** (через CLI/UI без deploy) | Infisical Cloud                             | Secrets (PAYLOAD_SECRET, S3 keys, DB URL), env-dependent runtime (URLs, S3 config, ALLOWED_ORIGINS), **feature flags**, **rate limits**, technical knobs |
| **Никто** (только с релизом кода)                  | Код                                         | TypeScript типы, app structure (routes, Dockerfile), архитектурные константы как комменты в R-правилах                                                   |

**Не путать:** «build-time константы» — это не значения которые могут менять devops, это типы и структура. Feature flag `ENABLE_NEW_DASHBOARD` → в Infisical (хочешь toggle без deploy), не в коде.

**Принцип:** если значение **может** менять кто-то без релиза кода — оно НЕ в коде. Куда именно — зависит от **кто**: content-менеджер → Payload, devops → Infisical.

## Skills (триггерить при попадании в зону)

| Skill                                     | Когда                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------- |
| `whg-rules`                               | Архитектурный выбор: блок / contracts / collection / URL-схема                |
| `whg-layouts`                             | SiteLayout / PanelConfig / Header/Footer/NavDrawer                            |
| `whg-modals`                              | Detail-модалка сущности (карточка с overlay)                                  |
| `whg-ui-reference`                        | Создаёшь UI-блок / страницу / визуальную композицию                           |
| `whg-infisical`                           | Секреты — bootstrap, ротация, новая env-переменная                            |
| `whg-template-sync`                       | Подтянуть upstream WHG generic                                                |
| `whg-scaffold`                            | (upstream only) — создание нового инстанса                                    |
| `whg-payload-jobs`                        | Payload Jobs Queue в нашем стиле (поверх официального)                        |
| `whg-payload-migration`                   | Миграции Payload в нашем blue-green deploy.sh                                 |
| `whg-skill-authoring`                     | Создаёшь / обновляешь наш `whg-*` skill — правила naming, inline vs reference |
| `payload`, `cms-migration`, `infisical-*` | Скачанные официальные — базовое знание от вендоров                            |
| `frontend-design`                         | UI с дизайн-усилиями                                                          |

## Что НЕ делать

- Хардкод контента на фронте (R0)
- Прямые импорты `cms/` → `client/` (R3)
- Доменные имена базовых блоков (R5++)
- `bg-[#hex]` / inline-color (R2 — токены)
- Деструктив на prod без явного «ок»
- Изобретать обобщения раньше второго случая (R9)
- Создавать новые репо для sub-products одной компании — растим в этом же (R4)

## Stop-conditions

- Архитектурная развилка (новая модель данных, breaking contract, выбор стека)
- Зацикливание — один fix не работает второй раз подряд
- Деструктив на shared/prod
- Что-то выглядит подозрительно

## Sources of truth (где что искать)

| Что                                        | Где                                                                            | Назначение                                                                                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Backlog** (все задачи, open + closed)    | [GitHub Issues](https://github.com/Vovanda/WebHolyGrail/issues)                | Bugs, features, chore. Labels: `bug`/`feat`/`chore`, `priority:*`, `area:*`. Single source of truth по тому что сделано / что предстоит. Закрытые issues = changelog по факту. |
| **PLAN (chain активных задач)**            | MCP `HolyGrail/plan/PLAN`                                                      | Короткая цепочка `1. #N → 2. #M → 3. #K`. Не дублирует backlog — указывает на issue-номера. Какая задача сейчас в работе, что после неё.                                       |
| **Findings (технические notes per issue)** | `docs/backlog/findings/<N>-<slug>.md`                                          | Длинные diagnostics / curl outputs / stack traces / design decisions которые неудобно в issue comment. Линкуется из issue.                                                     |
| **Session state (mid-task)**               | MCP `HolyGrail/session/active` + fallback `.claude/session-context/current.md` | Что делаю прямо в момент прерывания: «остановился на certbot retry», «жду docker pull», «гипотеза X в проверке». **Не** список задач — moment-in-time state для resume.        |
| **Memory rules / facts**                   | `~/.claude/projects/<sanitized-path>/memory/MEMORY.md`                         | Поведенческие правила, архитектурные решения, факты про проект которые AI должен помнить между сессиями.                                                                       |
| **Skills**                                 | `.claude/skills/<name>/SKILL.md`                                               | Reusable workflows для AI. Триггерятся по описанию.                                                                                                                            |
| **Docs / архитектура**                     | `docs/whg/`                                                                    | R0-R15, philosophy, decisions. Версионируется с кодом.                                                                                                                         |

### Workflow

1. **Новая задача от Володи** → `gh issue create --template <bug|feat|chore>` (попадает в backlog).
2. **Беру в работу** → добавляю как next step в PLAN.md chain (`#N → ...`).
3. **Mid-task state** (паузы, прерывания) → `HolyGrail/session/active` короткая запись.
4. **Технические findings по ходу** → `docs/backlog/findings/<N>-<slug>.md`, линкую обратно из issue.
5. **Готово** → commit с `Closes #N` (auto-closes issue) → вычёркиваю из chain.

`/save-context` skill сохраняет session state (3), не дублирует backlog (1) или chain (2).

---

## Только в upstream WHG (`Vovanda/WebHolyGrail`)

Применимо когда detect показал что это template, не инстанс:

- Это **шаблон**, не сайт. Никаких domain blocks / collections / routes / бизнес-контента. Корень = generic скелет для всех будущих инстансов.
- Изменения здесь распространяются через `sync-template.sh` в инстансы. Думай как изменение приземлится.
- `scripts/seeds/` пополняется по project types (`minimal` сейчас, `business-card`/`blog`/`portal` в roadmap).
- **Skill + docs парные** — `.claude/skills/holygrail-<X>/SKILL.md` ↔ `docs/whg/<num>-<x>.md`. При апдейте править оба.
- При scaffold нового инстанса — Claude замечает имя репо ≠ WHG и предлагает обновить README (это поведение описано выше).
- Перед merge крупного refactor'а — scaffold тестовый инстанс из ветки и убедись что `./dev.sh` стартует.
