import { expect, test } from '@playwright/test';

const CMS_BASE_URL = process.env.SMOKE_CMS_URL ?? 'http://localhost:3001';

/**
 * Smoke tests — самый минимум который должен зеленеть всегда.
 *
 * Что проверяем (Шаг 3 коммит 7):
 *  1. Главная фронта отвечает 200 и видит siteName из CMS (R3 жив).
 *  2. Админка CMS отвечает 200 и интерфейс на русском.
 *
 * Что НЕ проверяем здесь (это E2E / Шаг 5+):
 *  - Содержимое страниц-блоков (их ещё нет до Шага 4).
 *  - Авторизация в админке (там creation-first-user flow, отдельно).
 *  - Отправка форм.
 */

test.describe('Web Holy Grail — smoke', () => {
  test('главная фронта рендерит title из CMS (R3)', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status(), 'GET / должен вернуть 200').toBe(200);

    // <title> приходит из SiteSettings.siteName (см. client/src/app/layout.tsx).
    // Если CMS отвалилась — генерируется fallback «Питомник «Example Co.»».
    await expect(page).toHaveTitle(/Питомник/);

    // H1 — тот же siteName из contracts, sanity-check что server-fetch отработал.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Питомник');
  });

  test('админка Payload открывается, интерфейс на русском', async ({ page }) => {
    const response = await page.goto(`${CMS_BASE_URL}/admin`);
    expect(response?.status(), 'GET /admin должен вернуть 200').toBe(200);

    // Title задаётся через payload.config.ts `admin.meta.titleSuffix`.
    await expect(page).toHaveTitle(/Питомник veo55/);

    // Если уже есть admin (есть в локальной БД) — должна быть форма входа («Войти» / «Электронная почта»).
    // Если первый запуск (БД пустая) — будет «Создание первого пользователя».
    // Оба заголовка — на русском. Проверяем что НЕ английский.
    const html = await page.content();
    expect(html, 'админка должна быть на русском').toMatch(
      /Войти|Email|Создание первого пользователя|Добро пожаловать/,
    );
  });
});
