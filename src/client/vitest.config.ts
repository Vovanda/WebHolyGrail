import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Playwright smoke spec живёт в src/client/playwright/ и запускается через `pnpm smoke`.
// Vitest по умолчанию подбирает *.spec.ts по всему workspace — исключаем playwright/.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/playwright/**'],
  },
});
