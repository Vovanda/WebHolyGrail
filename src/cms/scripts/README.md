# `src/cms/scripts/` — обслуживание CMS

Одноразовые и периодические скрипты, которым нужен Payload Local API: работают против БД инстанса, поэтому запускаются либо локально, либо внутри контейнера `cms`.

| Файл                    | Команда                          | Зачем                                                            |
| ----------------------- | -------------------------------- | ---------------------------------------------------------------- |
| `check-schema-drift.ts` | `pnpm --filter cms check:schema` | сверяет схему коллекций с накатанными миграциями — гоняется в CI |

Запуск на проде — через контейнер активного цвета:

```bash
docker exec <slug>-cms-<color> sh -c "cd /app/src/cms && pnpm run <script>"
```

Правила миграций (forward-only, blue-green) — [`whg-payload-migration` skill](../../../.claude/skills/whg-payload-migration/SKILL.md). Фоновые задачи по расписанию живут не здесь, а в Payload Jobs Queue — [`whg-payload-jobs`](../../../.claude/skills/whg-payload-jobs/SKILL.md).

Скрипты инстанса (импорт контента из старой CMS, разовые правки данных) добавляются сюда же и в `package.json` соседним пунктом — они не generic и в upstream WHG не синкаются.
