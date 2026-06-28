import { defineConfig } from 'vitest/config';

// Playwright smoke spec живёт в src/client/playwright/ и запускается через `pnpm smoke`.
// Vitest по умолчанию подбирает *.spec.ts по всему workspace — исключаем playwright/.
export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/playwright/**'],
  },
});
