import { expect, test } from '@playwright/test';

/**
 * Сквозная проверка видео.
 *
 * @remarks
 * Проверяет то, что ломается чаще всего и заметнее всего: страница с видео
 * открывается, плеер собирается, плейлист рядом с ним листается, а закрытое
 * видео не отдаёт ключ.
 *
 * Идёт против уже поднятого сайта - как и остальной сквозной прогон. Адрес
 * задаётся снаружи, поэтому годится и для местной сборки, и для живого сайта.
 *
 * Записи на сайте может не быть вовсе - у пустого инстанса так и есть.
 * Проверка тогда пропускается: пустой шаблон это не поломка.
 */

const DEMO_PATH = process.env.SMOKE_VIDEO_PATH ?? '/video';

test.describe('Видео', () => {
  test('страница с видео открывается и собирает плеер', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');
    expect(response?.status()).toBe(200);

    const player = page.locator('media-player, video').first();
    await expect(player).toBeAttached({ timeout: 15_000 });
  });

  test('плейлист рядом с плеером листается видами', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    const byRow = page.getByRole('button', { name: 'Лентой' });
    if ((await byRow.count()) === 0) test.skip(true, 'плейлиста на странице нет');

    await byRow.click();
    await expect(page.locator('[aria-label="Видео плейлиста"]')).toBeVisible({ timeout: 10_000 });

    // Выбор запоминается: вернувшись, зритель видит тот же вид.
    await page.reload();
    await expect(page.getByRole('button', { name: 'Лентой' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('панель и список у плеера показывают одно видео', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    const tab = page.getByRole('button', { name: 'Плейлист' });
    if ((await tab.count()) === 0) test.skip(true, 'панели плейлиста на этом сайте нет');

    await tab.click();
    const panel = page.locator('aside .side-panel__body');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    // Второе видео в панели: первое уже играет, и по нему смены не увидеть.
    const cards = panel.locator('button');
    if ((await cards.count()) < 2) test.skip(true, 'в плейлисте меньше двух видео');
    await cards.nth(1).click();

    // Выбор уходит в адрес - по такой ссылке видео открывается сразу.
    await expect(page).toHaveURL(/[?&]v=/, { timeout: 10_000 });

    // И список рядом с плеером показывает то же самое: запись в адрес браузер
    // никому не сообщает, поэтому между списками ходит своё событие.
    const playingEverywhere = page.getByText('Играет сейчас');
    await expect(playingEverywhere.first()).toBeVisible({ timeout: 10_000 });
    expect(await playingEverywhere.count()).toBeGreaterThan(1);
  });

  test('закрытое видео ключа не отдаёт', async ({ page, request }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    if ((await page.locator('[data-access-code]').count()) === 0) {
      test.skip(true, 'закрытых видео на странице нет');
    }

    /*
      Замки живут в панели плейлиста, а она бывает свёрнута - тогда они есть
      в разметке, но невидимы, и нажать на них нельзя. Раньше тест брал первый
      попавшийся и падал именно на этом: смотрел в закрытую панель.

      Открываем её так же, как человек, - кнопкой рядом с плеером.
    */
    let locked = page.locator('[data-access-code]:visible').first();
    if ((await locked.count()) === 0) {
      const tab = page.getByRole('button', { name: 'Плейлист' });
      if ((await tab.count()) === 0) test.skip(true, 'замки скрыты, а панели плейлиста нет');
      await tab.click();
      locked = page.locator('[data-access-code]:visible').first();
    }

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
