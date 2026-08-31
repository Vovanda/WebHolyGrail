#!/usr/bin/env node
/**
 * Насколько сайт отстал от шаблона.
 *
 * @remarks
 * Отставание ничем не заметно: сборка зелёная, прогон зелёный, а половина
 * привезённого не подключена. Узнают об этом, когда что-то не работает - так
 * сегодня и вышло с ручками движка, которых не было ни у одного сайта.
 *
 * Проверка не роняет прогон: отставший сайт не сломан, он отстал. Дело
 * проверки - сказать это словами в том же месте, где смотрят остальное.
 *
 * Разрыв считается двумя способами. Если у прогона есть доступ к шаблону,
 * спрашиваем у него, сколько коммитов прошло с нашей отметки. Если доступа
 * нет - говорим по дате последнего обновления: она лежит рядом, в том же файле.
 *
 * В самом шаблоне проверка молчит: ему не от кого отставать.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Сколько дней без обновления считаем поводом сказать. */
const ДНЕЙ_ТЕРПЕНИЯ = 14;

const файл = path.resolve('.template-version');

if (!fs.existsSync(файл)) {
  // Это сам шаблон либо сайт, ни разу не обновлявшийся - сказать нечего.
  process.exit(0);
}

const текст = fs.readFileSync(файл, 'utf8');
const поле = (имя) => текст.match(new RegExp(`^${имя}=(.*)$`, 'm'))?.[1]?.trim() ?? '';

const наша = поле('source_sha');
const когда = поле('synced_at');
const ветка = поле('source_ref') || 'main';

if (!наша) {
  console.log('Обновление: отметки о версии шаблона нет - synced_at и source_sha пусты.');
  process.exit(0);
}

const дней = когда ? Math.floor((Date.now() - Date.parse(когда)) / 86400000) : null;

const репозиторийШаблона = process.env.TEMPLATE_REPO ?? 'Vovanda/WebHolyGrail';
const токен = process.env.TEMPLATE_TOKEN ?? process.env.GITHUB_TOKEN ?? '';

/** Спрашивает у шаблона, сколько коммитов прошло с нашей отметки. */
async function разрывПоКоммитам() {
  if (!токен) return null;
  const адрес = `https://api.github.com/repos/${репозиторийШаблона}/compare/${наша}...${ветка}`;
  try {
    const ответ = await fetch(адрес, {
      headers: { Authorization: `Bearer ${токен}`, Accept: 'application/vnd.github+json' },
    });
    if (!ответ.ok) return null;
    const данные = await ответ.json();
    return typeof данные.ahead_by === 'number' ? данные.ahead_by : null;
  } catch {
    return null;
  }
}

const позади = await разрывПоКоммитам();

if (позади === 0) {
  console.log(`Обновление: сайт на свежем шаблоне (${наша}).`);
  process.exit(0);
}

if (позади !== null) {
  console.log(
    `Обновление: сайт отстал от шаблона на ${позади} коммитов (наш ${наша}, обновлялись ${когда || 'неизвестно когда'}).`,
  );
  console.log('  Догнать: node scripts/sync-template.mjs . --repo <путь к шаблону> --ref main');
  process.exit(0);
}

// Без доступа к шаблону судим по времени: это грубее, но честно.
if (дней !== null && дней >= ДНЕЙ_ТЕРПЕНИЯ) {
  console.log(`Обновление: шаблон не подтягивали ${дней} дней (наш ${наша}).`);
  console.log('  Догнать: node scripts/sync-template.mjs . --repo <путь к шаблону> --ref main');
} else if (дней !== null) {
  console.log(`Обновление: шаблон подтягивали ${дней} дней назад (наш ${наша}).`);
} else {
  console.log(`Обновление: наш шаблон ${наша}, когда обновлялись - в отметке не сказано.`);
}
