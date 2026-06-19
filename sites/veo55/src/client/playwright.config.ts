import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — smoke against running dev servers.
 *
 * @remarks
 * Не запускает свои dev-серверы (`webServer`) — ожидает что client (3000) и
 * cms (3001) уже подняты (через `pnpm dev` локально или `pnpm compose:up` в Docker).
 * Это умышленно: smoke = «работает ли уже запущенное», не «можем ли мы вообще
 * собрать».
 */
export default defineConfig({
  testDir: './playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
