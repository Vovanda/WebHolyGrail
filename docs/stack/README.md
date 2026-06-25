# Stack reference

Compact reference per компонент стека Holy Grail: что используем, версии, ссылки, как обновлять, известные ограничения. Не tutorial, а quick lookup для разработчика и агента.

| Component | File | Что покрывает |
|---|---|---|
| Infisical | [`infisical.md`](infisical.md) | Self-host (single instance + project per site), Postgres, CLI/SDK установка, AI skills repo, `infisical bootstrap`, REST endpoints, ограничения |
| Payload CMS | [`payload.md`](payload.md) | Payload 3.x — 3 локальных skill'а + `@payloadcms/skills` AI repo, Local API / REST / Jobs Queue / migrations, что используем и НЕ используем |
| Next.js | _todo_ | (добавится при первом большом изменении) |
| S3 storage (MinIO) | _todo_ | (после первого реального теста с MinIO) |
| Docker / blue-green | _todo_ | (после первого scaffold'а sawking-tech) |

## Принцип содержания

Каждый файл — короткий reference, не tutorial. Структура:
- Что это в нашем контексте + что НЕ это
- Текущие версии + где tracking релизов
- Установка (CLI / SDK / MCP / skills)
- Что используем, что НЕ используем + почему
- REST/CLI/SDK endpoints / commands мы реально касаемся
- Когда апдейтить (cadence)
- Watchlist: ограничения и trade-offs которые мы знаем

Не дублируем официальную документацию. Только то что важно **для нашего workflow и решений**.

## Обновление

- Каждый месяц — `pnpm outdated -r` + проверить changelog'и через ссылки из stack-файлов
- При обновлении major версии любого компонента — обновить соответствующий файл здесь и `40-versions.md`
- Когда находим новый MCP server / AI skill для компонента — добавить в установочную секцию
