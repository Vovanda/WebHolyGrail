import { expect, test, type Page } from '@playwright/test';

const CMS_BASE_URL = process.env.SMOKE_CMS_URL ?? 'http://localhost:3001';

/**
 * Смоук: живой ли сайт.
 *
 * @remarks
 * Проверка идёт по тому, чем сайт является для посетителя: главная открывается
 * и что-то говорит, пункты меню ведут на живые страницы, за списками стоят
 * отвечающие ручки, а картинки и записи действительно отдаются раздачей.
 *
 * Прежняя проверка сверяла заголовок страницы с именем сайта. Это было верно,
 * пока сайт стоял пустой: тогда в заголовке и правда было имя. На наполненном
 * сайте там стоит заголовок обложки, и проверка краснела на здоровом сайте -
 * то есть не сторожила ничего.
 *
 * Отдельно проверяются адреса медиа: раздача одного из сайтов неделями
 * отвечала отказом, и заметили это люди. Смоук читал разметку и по адресам
 * не ходил.
 */

/** Сколько адресов медиа проверять со страницы: хватает нескольких, прогон не резиновый. */
const MEDIA_LIMIT = 8;

/** Собирает со страницы адреса картинок, постеров и нарезок. */
async function mediaUrls(page: Page): Promise<string[]> {
  return page.evaluate((limit) => {
    const found = new Set<string>();

    for (const img of Array.from(document.querySelectorAll('img'))) {
      const src = img.currentSrc || img.src;
      if (src && !src.startsWith('data:')) found.add(src);
    }
    for (const video of Array.from(document.querySelectorAll('video'))) {
      const poster = video.getAttribute('poster');
      if (poster) found.add(poster);
      const source = video.querySelector('source')?.getAttribute('src');
      if (source) found.add(source);
    }

    return Array.from(found).slice(0, limit);
  }, MEDIA_LIMIT);
}

test.describe('Смоук: сайт живой', () => {
  test('главная открывается и говорит о себе', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status(), 'главная должна отвечать').toBe(200);

    const title = await page.title();
    expect(title.trim().length, 'у страницы должен быть заголовок').toBeGreaterThan(0);

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading, 'на главной должен быть заголовок первого уровня').toBeVisible();
    expect(
      (await heading.innerText()).trim().length,
      'заголовок не должен быть пустым',
    ).toBeGreaterThan(0);
  });

  test('пункты меню ведут на живые страницы', async ({ page }) => {
    await page.goto('/');

    const links = await page.evaluate(() => {
      const nav = document.querySelector('header') ?? document.body;
      return Array.from(nav.querySelectorAll('a[href^="/"]'))
        .map((a) => a.getAttribute('href') ?? '')
        .filter((href) => href && !href.startsWith('//') && !href.startsWith('/#'))
        .slice(0, 6);
    });

    expect(links.length, 'в шапке должны быть ссылки на страницы').toBeGreaterThan(0);

    for (const href of links) {
      const response = await page.request.get(href);
      expect(response.status(), `страница ${href} должна отвечать`).toBeLessThan(400);
    }
  });

  test('картинки и записи отдаются раздачей', async ({ page }) => {
    await page.goto('/');
    // Ленивые картинки грузятся по мере прокрутки: без этого со страницы
    // собирается один-два адреса из начала.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);

    const urls = await mediaUrls(page);
    expect(urls.length, 'на главной должны быть картинки или записи').toBeGreaterThan(0);

    for (const url of urls) {
      const response = await page.request.get(url);
      expect(response.status(), `раздача не отдаёт ${url}`).toBeLessThan(400);
    }
  });

  test('настройки сайта приходят из CMS', async ({ page }) => {
    const response = await page.request.get(`${CMS_BASE_URL}/api/globals/site-settings?depth=0`);
    expect(response.status(), 'настройки сайта должны отдаваться').toBe(200);

    const settings = (await response.json()) as { siteName?: string };
    expect(
      (settings.siteName ?? '').trim().length,
      'у сайта должно быть имя в настройках',
    ).toBeGreaterThan(0);
  });

  /*
    Язык админки Payload выбирает по языку браузера, а не по настройке сайта:
    та задаёт лишь запасной. Поэтому язык зритель просит явно - иначе проверка
    краснеет на здоровой админке, открытой браузером с английским языком.
  */
  test.describe('админка', () => {
    test.use({ locale: 'ru-RU', extraHTTPHeaders: { 'Accept-Language': 'ru-RU,ru' } });

    test('открывается и говорит по-русски', async ({ page }) => {
      const response = await page.goto(`${CMS_BASE_URL}/admin`);
      expect(response?.status(), 'админка должна отвечать').toBe(200);

      const html = await page.content();
      expect(html, 'админка должна быть на русском').toMatch(
        /Войти|Электронная почта|Создание первого пользователя|Добро пожаловать/,
      );
    });
  });
});
