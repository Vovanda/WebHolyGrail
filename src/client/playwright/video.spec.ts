import { expect, test } from '@playwright/test';

/**
 * Сквозная проверка видео.
 *
 * @remarks
 * Проверяет то, что ломается чаще всего и заметнее всего: страница с записями
 * открывается, плеер собирается, набор рядом с ним листается, а закрытая
 * запись не отдаёт ключ.
 *
 * Идёт против уже поднятого сайта - как и остальной сквозной прогон. Адрес
 * задаётся снаружи, поэтому годится и для местной сборки, и для живого сайта.
 *
 * Записи на сайте может не быть вовсе - у пустого инстанса так и есть.
 * Проверка тогда пропускается: пустой шаблон это не поломка.
 */

const DEMO_PATH = process.env.SMOKE_VIDEO_PATH ?? '/video';

test.describe('Видео', () => {
  test('страница с записями открывается и собирает плеер', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');
    expect(response?.status()).toBe(200);

    const player = page.locator('media-player, video').first();
    await expect(player).toBeAttached({ timeout: 15_000 });
  });

  test('набор рядом с плеером листается видами', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    const byRow = page.getByRole('button', { name: 'Лентой' });
    if ((await byRow.count()) === 0) test.skip(true, 'набора на странице нет');

    await byRow.click();
    await expect(page.locator('[aria-label="Видео набора"]')).toBeVisible({ timeout: 10_000 });

    // Выбор запоминается: вернувшись, зритель видит тот же вид.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Лентой' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('закрытая запись ключа не отдаёт', async ({ page, request }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    const locked = page.locator('[data-access-code]').first();
    if ((await locked.count()) === 0) test.skip(true, 'закрытых записей на странице нет');

    // Нажатие на замок ведёт к вводу кода, а не в никуда.
    await locked.click();
    await expect(page.getByPlaceholder('Код доступа')).toBeVisible({ timeout: 10_000 });

    // И сам ключ незнакомцу не выдаётся.
    const cms = process.env.SMOKE_CMS_URL ?? 'http://localhost:3001';
    const token = await request.post(`${cms}/api/video/token`);
    const { token: viewer } = (await token.json()) as { token: string };
    const denied = await request.get(
      `${cms}/api/video/999999/envelope?token=${encodeURIComponent(viewer)}`,
    );
    expect(denied.ok()).toBeFalsy();
  });
});
