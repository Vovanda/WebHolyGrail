# L1 — UI primitives (shadcn)

Атомы интерфейса: button, input, dialog, badge, dropdown, tooltip, separator и т.д.

Добавляются через shadcn CLI:

```bash
pnpm dlx shadcn@latest add button input dialog
```

Файлы появляются в этой папке. Стилизуются через CSS-переменные из `styles/tokens.css` — никаких `bg-[#hex]` или захардкоженных цветов (R2).

## Правило

- L1 (`ui/`) — без бизнес-логики, без зависимостей от `blocks/`, `lib/`, `domain/`. Голые компоненты вокруг радикс-примитивов.
- L2 `blocks/primitives/` собирается ИЗ L1 — добавляет композицию, состояние, контракт пропсов.
