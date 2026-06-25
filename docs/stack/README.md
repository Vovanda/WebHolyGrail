# Stack reference

Compact reference per компонент стека Holy Grail: что используем, версии, ссылки, как обновлять, известные ограничения. Не tutorial, а quick lookup для разработчика и агента.

| Component | File | Что покрывает |
|---|---|---|
| Infisical | [`infisical.md`](infisical.md) | Self-host (single instance + project per site), Postgres, CLI/SDK установка, AI skills repo, `infisical bootstrap`, REST endpoints, ограничения |
| Payload CMS | _todo_ | (заглушка — добавится при первом большом изменении) |
| Next.js | _todo_ | (заглушка) |
| S3 storage (MinIO) | _todo_ | (заглушка) |
| Docker / blue-green | _todo_ | (заглушка) |

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
