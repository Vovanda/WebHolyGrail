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

/**
 * Есть ли на странице то, что ждём.
 *
 * @remarks
 * Списки собираются в браузере, и первый же взгляд застаёт страницу пустой:
 * проверка тогда пропускала себя сама и показывала зелёное там, где ничего
 * не смотрела. Поэтому сперва ждём, и только потом решаем, что этого нет.
 */
async function appears(target: import('@playwright/test').Locator): Promise<boolean> {
  try {
    await target.first().waitFor({ state: 'attached', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

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
    if (!(await appears(byRow))) test.skip(true, 'плейлиста на странице нет');

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
    if (!(await appears(tab))) test.skip(true, 'панели плейлиста на этом сайте нет');

    await tab.click();
    const panel = page.locator('aside .side-panel__body');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    /*
      Второе играющее видео в панели: первое уже открыто, и по нему смены
      не увидеть. Закрытые не в счёт - они ведут к вводу кода, а не к показу,
      и выбираются ссылкой, а не кнопкой.
    */
    const cards = panel.locator('[data-part="card"]:not(:has([data-access-code])) button');
    if ((await cards.count()) < 2) test.skip(true, 'в плейлисте меньше двух открытых видео');
    await cards.nth(1).click();

    // Выбор уходит в адрес - по такой ссылке видео открывается сразу.
    await expect(page).toHaveURL(/[?&]v=/, { timeout: 10_000 });

    // И список рядом с плеером показывает то же самое: запись в адрес браузер
    // никому не сообщает, поэтому между списками ходит своё событие.
    const playingEverywhere = page.getByText('Играет сейчас');
    await expect(playingEverywhere.first()).toBeVisible({ timeout: 10_000 });
    expect(await playingEverywhere.count()).toBeGreaterThan(1);
  });

  test('закрытое видео ключа не отдаёт', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    if (!(await appears(page.locator('[data-access-code]')))) {
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

    // Нажатие на замок ведёт к вводу кода, а не в никуда. Поле стоит всегда:
    // код бывает на руках раньше, чем сайт о нём знает.
    await locked.click();
    await expect(page.getByPlaceholder('Код доступа')).toBeVisible({ timeout: 10_000 });

    /*
      И сам ключ этой записи не выдаётся. Спрашиваем той же дверью и из того же
      браузера, что и плеер: идентичность живёт кукой, а через сторонний запрос
      её нет - отказ пришёл бы и без всякой проверки прав.

      Ждём именно отказ по праву. Прежняя проверка стучалась в снятую ручку
      и получала 404: «не ok» она видела, а выдачу ключа не проверяла вовсе.
    */
    const videoId = await locked.getAttribute('data-access-code');
    expect(videoId, 'у замка нет номера записи').toBeTruthy();

    // Номер отрезка обязателен там, где запись нарезана с криптопериодами:
    // без него выдача отвечает «не указан период», и права она не смотрит.
    const denied = await page.request.get(
      `/internal/video/key/${encodeURIComponent(String(videoId))}?p=0`,
    );
    expect(denied.status()).toBe(403);
    const reason = ((await denied.json()) as { error?: string }).error;
    expect(['bad-token', 'not-entitled']).toContain(reason);
  });

  test('код открывает закрытое видео', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    /*
      Код печатает витрина - кнопкой рядом с подборкой. Там, где такой кнопки
      нет, взять код изнутри проверки неоткуда: на обычном сайте его выдаёт
      владелец, и путь до конца проходится руками.
    */
    const demoButton = page.getByRole('button', { name: 'Получить код' });
    if (!(await appears(demoButton))) test.skip(true, 'кнопки демо-кода на сайте нет');

    // Сперва код, потом замок: открытая форма сдвигает страницу, и кнопка
    // уезжает из видимой части.
    await demoButton.first().click();
    const shown = page.locator('[data-part="code"]').first();
    await expect(shown).toBeVisible({ timeout: 20_000 });
    const code = ((await shown.textContent()) ?? '').trim();
    expect(code, 'панель не показала код').not.toEqual('');

    let locked = page.locator('[data-access-code]:visible').first();
    if ((await locked.count()) === 0) {
      const tab = page.getByRole('button', { name: 'Плейлист' });
      if ((await tab.count()) === 0) test.skip(true, 'закрытых видео на странице нет');
      await tab.click();
      locked = page.locator('[data-access-code]:visible').first();
      if ((await locked.count()) === 0) test.skip(true, 'закрытых видео на странице нет');
    }

    await locked.click();
    const field = page.getByPlaceholder('Код доступа');
    await expect(field).toBeVisible({ timeout: 10_000 });

    await field.fill(code);
    await page.getByRole('button', { name: 'Открыть' }).first().click();

    /*
      Право выдано - на месте формы встаёт плеер. Проверяем именно это: сам
      факт «код принят» ничего не стоит, если человек видит ту же заглушку.
    */
    await expect(field).toBeHidden({ timeout: 20_000 });
    await expect(page.locator('media-player, video').first()).toBeAttached({ timeout: 20_000 });
  });
});
