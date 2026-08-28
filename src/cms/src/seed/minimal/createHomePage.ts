import type { Payload } from 'payload';
import { DEFAULT_SITE_NAME } from '../../globals/SiteSettings.js';

/**
 * createHomePage — нейтральный минимум для нового сайта: пустая главная и имя
 * сайта из параметра.
 *
 * @remarks
 * Ничего от движка сюда не попадает (#72): ни логотипа, ни меню, ни контактов,
 * ни блоков. Свежий инстанс не должен выглядеть витриной Web Holy Grail —
 * хардкод движка допустим только на его собственной главной
 * (`seed:whg-landing`), а на стороннем сайте от WHG остаётся лишь подпись
 * «Built on Web Holy Grail» в футере.
 *
 * Имя сайта берётся из `SITE_NAME`, иначе из `SITE_SLUG` (он и так есть в
 * окружении деплоя), иначе остаётся дефолт схемы.
 *
 * Идемпотентно:
 *  - SiteSettings: имя ставим только пока там пусто или дефолт схемы — правку
 *    из админки не затираем.
 *  - Page: существующую главную не трогаем вообще.
 */
export async function createHomePage(payload: Payload): Promise<{ created: boolean; id: string }> {
  const siteName = process.env['SITE_NAME'] ?? process.env['SITE_SLUG'];

  if (siteName) {
    const settings = await payload.findGlobal({ slug: 'site-settings' });
    if (!settings.siteName || settings.siteName === DEFAULT_SITE_NAME) {
      await payload.updateGlobal({
        slug: 'site-settings',
        data: { siteName },
      });
    }
  }

  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length > 0) {
    return { created: false, id: String(existing.docs[0]!.id) };
  }

  const page = await payload.create({
    collection: 'pages',
    data: {
      title: 'Главная',
      slug: 'home',
      /*
        Главная каркаса публикуется: без неё свежий сайт отдаёт «страница не найдена».
        Всё остальное, что добавляется в наполнение примером - образцы блоков,
        демонстрационные разделы, - заводится черновиком: пример виден владельцу
        в админке, а посетителю нет, пока тот не опубликует сам.
      */
      _status: 'published' as const,
      blocks: [],
    },
    overrideAccess: true,
  });

  return { created: true, id: String(page.id) };
}
