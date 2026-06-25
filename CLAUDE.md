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
  Не lecture, не настойчиво — одно предложение, ждёшь ответа. Если пользователь скажет «не сейчас» / проигнорирует — продолжай работу как обычно.
- **Если есть `.template-version` в корне** — это однозначный маркер инстанса (после `sync-template.sh`).

## Принципы (R0–R15 кратко)

Полный список — [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md). Самое важное:

- **R0** — Контент в БД (Payload), не в коде. Меняется без deploy.
- **R3** — `client/` ↔ `cms/` только через `contracts/`. Никаких прямых импортов.
- **R4** — Side-scaling. Новая фича = новый `blocks/domain/<niche>/` + collections + routes в этом же репо.
- **R5++** — Именование функциональное (`EntityCard`, не `DogCard`).
- **R9** — Обобщение снизу вверх (не делать generic-`Card` до 2-3 живых niche-карточек).
- **R14** — SSR по умолчанию. `'use client'` только для DOM/browser API.

Перед архитектурным выбором — активируй skill `holygrail-rules`.

## Где что живёт

Граница проводится по **кто меняет**, не по типу данных:

| Кто меняет | Где | Что туда уходит |
|---|---|---|
| **Content manager** (через UI без разработчика) | Payload `SiteSettings` global + collections | siteName, контакты, mainNav, footer links, theme/palette name, бренд, доменные сущности (Posts, Products, Customers, …) |
| **Разработчик / DevOps** (через CLI/UI без deploy) | Infisical Cloud | Secrets (PAYLOAD_SECRET, S3 keys, DB URL), env-dependent runtime (URLs, S3 config, ALLOWED_ORIGINS), **feature flags**, **rate limits**, technical knobs |
| **Никто** (только с релизом кода) | Код | TypeScript типы, app structure (routes, Dockerfile), архитектурные константы как комменты в R-правилах |

**Не путать:** «build-time константы» — это не значения которые могут менять devops, это типы и структура. Feature flag `ENABLE_NEW_DASHBOARD` → в Infisical (хочешь toggle без deploy), не в коде.

**Принцип:** если значение **может** менять кто-то без релиза кода — оно НЕ в коде. Куда именно — зависит от **кто**: content-менеджер → Payload, devops → Infisical.

## Skills (триггерить при попадании в зону)

| Skill | Когда |
|---|---|
| `holygrail-rules` | Архитектурный выбор: блок / contracts / collection / URL-схема |
| `holygrail-layouts` | SiteLayout / PanelConfig / Header/Footer/NavDrawer |
| `holygrail-modals` | Detail-модалка сущности (карточка с overlay) |
| `holygrail-ui-reference` | Создаёшь UI-блок / страницу / визуальную композицию |
| `holygrail-infisical` | Секреты — bootstrap, ротация, новая env-переменная |
| `holygrail-template-sync` | Подтянуть upstream WHG generic |
| `holygrail-scaffold` | (upstream only) — создание нового инстанса |
| `payload`, `payload-jobs`, `payload-migration` | Payload — collections, fields, hooks, миграции, jobs |
| `frontend-design` | UI с дизайн-усилиями |

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

## Память

- MCP `HolyGrail/session/active`, `HolyGrail/plan/PLAN`
- Project memory: `~/.claude/projects/<sanitized-path>/memory/MEMORY.md`
- Skills: `.claude/skills/<name>/SKILL.md`

---

## Только в upstream WHG (`Vovanda/WebHolyGrail`)

Применимо когда detect показал что это template, не инстанс:

- Это **шаблон**, не сайт. Никаких domain blocks / collections / routes / бизнес-контента. Корень = generic скелет для всех будущих инстансов.
- Изменения здесь распространяются через `sync-template.sh` в инстансы. Думай как изменение приземлится.
- `scripts/seeds/` пополняется по project types (`minimal` сейчас, `business-card`/`blog`/`portal` в roadmap).
- **Skill + docs парные** — `.claude/skills/holygrail-<X>/SKILL.md` ↔ `docs/whg/<num>-<x>.md`. При апдейте править оба.
- При scaffold нового инстанса — Claude замечает имя репо ≠ WHG и предлагает обновить README (это поведение описано выше).
- Перед merge крупного refactor'а — scaffold тестовый инстанс из ветки и убедись что `./dev.sh` стартует.
