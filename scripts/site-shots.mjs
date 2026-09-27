#!/usr/bin/env node
// Снимки и описания сайтов в блоке «Реальные сайты» (built-with) на странице-витрине.
//
// Для каждого сайта из блока: снимок первого экрана в светлой и тёмной теме,
// описание из meta description сайта. Снимки уходят в медиатеку витрины,
// элемент блока получает их и новое описание - через API, как любой контент.
//
//   node scripts/site-shots.mjs --showcase https://<витрина> --page home [--only <адрес>] [--dry]
//
// Ключ API админа витрины - в переменной SHOWCASE_API_KEY (Payload: users API-Key).
// Playwright берётся из src/client.

import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';

const require = createRequire(new URL('../src/client/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const { values: args } = parseArgs({
  options: {
    showcase: { type: 'string' },
    page: { type: 'string', default: 'home' },
    only: { type: 'string' },
    dry: { type: 'boolean', default: false },
  },
});
if (!args.showcase) throw new Error('нужен --showcase');
const KEY = process.env.SHOWCASE_API_KEY;
if (!KEY && !args.dry) throw new Error('нужен SHOWCASE_API_KEY');

const VIEWPORT = { width: 1440, height: 900 };
// Папка в хранилище: снимки не смешиваются с остальной медиатекой
const PREFIX = 'sites';
const auth = { Authorization: `users API-Key ${KEY}` };

async function api(path, init = {}) {
  const res = await fetch(`${args.showcase}${path}`, {
    ...init,
    headers: { ...auth, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      `${init.method ?? 'GET'} ${path}: ${res.status} ${JSON.stringify(body).slice(0, 300)}`,
    );
  return body;
}

/** Снимок первого экрана в заданной теме и описание сайта. */
async function capture(browser, url, theme) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    colorScheme: theme,
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await page.waitForTimeout(800);
  const shot = await page.screenshot({ type: 'png' });
  const description = await page
    .locator('meta[name="description"], meta[property="og:description"]')
    .first()
    .getAttribute('content')
    .catch(() => null);
  await ctx.close();
  return { shot, description: description?.trim() || null };
}

async function upload(png, filename, alt) {
  const form = new FormData();
  form.append('file', new Blob([png], { type: 'image/png' }), filename);
  form.append('_payload', JSON.stringify({ alt, prefix: PREFIX }));
  const res = await api('/api/media', { method: 'POST', body: form });
  return res.doc.id;
}

const pages = await api(
  `/api/pages?limit=1&depth=0&where[slug][equals]=${encodeURIComponent(args.page)}`,
);
const doc = pages.docs[0];
if (!doc) throw new Error(`страница ${args.page} не найдена`);

const browser = await chromium.launch();
let changed = 0;
for (const block of doc.blocks ?? []) {
  if (block.blockType !== 'built-with') continue;
  for (const item of block.items ?? []) {
    if (args.only && !item.url.includes(args.only)) continue;
    const host = new URL(item.url).hostname;
    const light = await capture(browser, item.url, 'light');
    const dark = await capture(browser, item.url, 'dark');
    console.log(`${host}: описание ${light.description ? 'есть' : 'нет'}`);
    if (args.dry) continue;
    item.screenshot = await upload(
      light.shot,
      `shot-${host}-light.png`,
      `Снимок сайта ${item.siteName}, светлая тема`,
    );
    item.screenshotDark = await upload(
      dark.shot,
      `shot-${host}-dark.png`,
      `Снимок сайта ${item.siteName}, тёмная тема`,
    );
    if (light.description) item.niche = light.description;
    changed++;
  }
}
await browser.close();

if (changed) {
  await api(`/api/pages/${doc.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks: doc.blocks, _status: 'published' }),
  });
  console.log(`обновлено сайтов: ${changed}`);
}
