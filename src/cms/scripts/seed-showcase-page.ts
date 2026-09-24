/**
 * Статья с примерами блоков внутри текста.
 *
 * @remarks
 * Нужна для просмотра глазами: блоков в наборе три десятка, и увидеть их разом
 * можно только на одной странице. Именно статья, а не страница: в тексте блок
 * встаёт между абзацами, и там у него свои поля - ширина колонки, отступы,
 * соседство с типографикой.
 *
 * Данные собираются по самой схеме блока: обязательное поле заполняется
 * значением по своему типу, поэтому список не надо править вслед за каждым
 * новым блоком.
 *
 * Содержимое идёт обычным путём записи, а не миграцией: статья живёт в базе
 * и правится владельцем, как любая другая (R0).
 *
 * Запуск:
 *
 * ```bash
 * pnpm --filter cms seed:showcase           # посмотреть, что попадёт в статью
 * pnpm --filter cms seed:showcase --apply   # создать или обновить /blog/blocks-showcase
 * ```
 */
import payload from 'payload';
import type { Block, Field } from 'payload';

import config from '../src/payload.config';
import { PAGE_BLOCKS } from '../src/blocks';

const apply = process.argv.includes('--apply');

const SLUG = 'blocks-showcase';

/**
 * Тексты по смыслу поля.
 *
 * @remarks
 * Одна строка на все поля делала страницу нечитаемой: в заголовке, в кнопке
 * и в подписи стояло одно и то же, длинная фраза налезала на соседнюю. Здесь
 * текст подбирается по имени поля и по его длине - заголовок короткий, описание
 * в пару предложений, кнопка в два слова.
 */
const TEXTS: Record<string, readonly string[]> = {
  title: ['Монтаж вентиляции', 'Чистое помещение под ключ', 'Пусконаладка и сдача'],
  heading: ['Что мы делаем', 'Как устроена работа', 'Сроки и этапы'],
  label: ['Подробнее', 'Смотреть', 'Оставить заявку'],
  subtitle: ['Коротко о главном', 'Без лишних слов', 'Что важно знать'],
  text: [
    'Собираем узел на месте, проверяем расход и сдаём с протоколом.',
    'Работы идут по графику, каждый этап принимается отдельно.',
  ],
  description: [
    'Показываем, как блок ведёт себя рядом с обычным текстом статьи.',
    'Тот же блок с другими данными - видно, что меняется от содержимого.',
  ],
  body: ['Абзац внутри блока: по нему видно кегль, межстрочное расстояние и ширину строки.'],
  author: ['Мастер участка', 'Главный инженер'],
  role: ['Подрядчик', 'Заказчик'],
  caption: ['Кадр со стройки', 'Съёмка с объекта'],
  alt: ['Кадр со стройки', 'Съёмка с объекта'],
  name: ['Вентиляция', 'Отопление', 'Автоматика'],
  /* Значок - это знак, а не фраза: поле рисуется кружком в сорок точек,
     и текст из него вываливается на соседние строки. */
  icon: ['✔', '★', '⚡', '◆'],
  value: ['12 объектов', '4 года', '98%'],
};

/** Поля, куда текст класть нельзя вовсе: там ждут знак или короткое слово. */
const SHORT_FIELDS = new Set(['icon', 'emoji', 'badge', 'symbol']);

/** Запасной текст: у поля, которого нет в перечне. */
const FALLBACK_TEXT = 'Пример содержимого блока';

function textFor(name: string, at: number): string {
  const variants = TEXTS[name] ?? TEXTS[name.replace(/Title|Text|Label$/, '').toLowerCase()];
  if (variants && variants.length > 0) return variants[at % variants.length] ?? variants[0]!;
  if (SHORT_FIELDS.has(name)) return '✔';
  return at > 0 ? `${FALLBACK_TEXT} ${at}` : FALLBACK_TEXT;
}

/** Блоки, которым нужны данные, каких на стенде нет; ставить их пустыми незачем. */
const SKIP = new Set(['reusable-ref', 'page-ref']);

interface Pick {
  readonly image?: number | string | undefined;
  /** Связи заполняются первой живой записью: пустая связь проверку не проходит. */
  readonly relations: Readonly<Record<string, number | string | undefined>>;
}

function paragraph(text: string): Record<string, unknown> {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0 }],
  };
}

function heading(text: string): Record<string, unknown> {
  return {
    type: 'heading',
    tag: 'h2',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0 }],
  };
}

/** Блок внутри текста: поля лежат в узле, а не рядом с ним. */
function blockNode(fields: Record<string, unknown>): Record<string, unknown> {
  return { type: 'block', version: 2, format: '', fields };
}

/*
  Тело статьи собирается вручную, и его тип у Payload описан деревом узлов
  редактора. Приведение здесь одно на весь скрипт - вместо него пришлось бы
  повторять описание дерева, которое и так живёт в самом редакторе.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- дерево редактора описано самим Payload
function lexical(children: ReadonlyArray<Record<string, unknown>>): any {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children,
    },
  };
}

/**
 * Значение поля по его типу: схема знает, что нужно, а не мы.
 *
 * @remarks
 * Место строки в наборе тоже учитывается: у двух строк одного массива тексты
 * должны отличаться, иначе блок выглядит сломанным показом, а не примером.
 */
function valueOf(field: Field, pick: Pick, at = 0): unknown {
  if (!('type' in field)) return undefined;

  const name = 'name' in field && field.name ? field.name : '';
  const text = textFor(name, at);

  switch (field.type) {
    case 'text':
      return text;
    case 'textarea':
      return text;
    case 'code':
      // Своя разметка ждёт разметку, а не фразу: текстом она не проходит проверку.
      return '<p>Своя разметка блока</p>';
    case 'json':
      return {};
    case 'richText':
      return lexical([paragraph(text)]);
    case 'number':
      return 1;
    case 'checkbox':
      return true;
    case 'date':
      return new Date().toISOString();
    case 'select': {
      const options = field.options ?? [];
      const first = options[0];
      if (!first) return undefined;
      return typeof first === 'string' ? first : first.value;
    }
    // Поле с несколькими значениями ждёт список: одиночное значение в нём
    // не проходит проверку, а на сайте ломает показ блока.
    case 'upload':
      return field.hasMany ? [pick.image] : pick.image;
    case 'relationship': {
      const to = field.relationTo;
      const one = typeof to === 'string' ? to : to?.[0];
      const related = one ? pick.relations[one] : undefined;
      if (related === undefined) return undefined;
      return field.hasMany ? [related] : related;
    }
    case 'array':
      // Две строки: на одной не видно, как блок ведёт себя с набором.
      return [fill(field.fields ?? [], pick, 1), fill(field.fields ?? [], pick, 2)];
    case 'group':
      return fill(field.fields ?? [], pick, at);
    default:
      return undefined;
  }
}

/**
 * Поля, которые заполнять незачем.
 *
 * @remarks
 * Это настройки вида и служебные пометки: заполни их - и вместо примера блока
 * получится пример нестандартного оформления. Содержимое блока живёт в других
 * полях, и они заполняются все, а не только обязательные: у половины набора
 * картинки и карточки лежат в необязательном массиве, и без них блок выходит
 * пустой рамкой.
 */
const SKIP_FIELDS = new Set([
  'appearanceCss',
  'visibility',
  'blockName',
  'anchor',
  'spacing',
  'space',
  'width',
  'align',
  'tileLayout',
  'tileLayoutMd',
  'tileLayoutSm',
]);

function fill(fields: readonly Field[], pick: Pick, at = 0): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const field of fields) {
    if ('fields' in field && !('name' in field)) {
      Object.assign(data, fill(field.fields as Field[], pick, at));
      continue;
    }
    if (!('name' in field) || !field.name) continue;
    if (SKIP_FIELDS.has(field.name)) continue;

    const value = valueOf(field, pick, at);
    if (value !== undefined) data[field.name] = value;
  }

  return data;
}

function blockData(block: Block, pick: Pick): Record<string, unknown> {
  return { blockType: block.slug, ...fill(block.fields as Field[], pick) };
}

async function main(): Promise<void> {
  await payload.init({ config });

  const images = await payload.find({
    collection: 'media',
    where: { mimeType: { like: 'image/' } },
    limit: 1,
    depth: 0,
  });

  /*
    Связи заполняются первой живой записью подходящей коллекции: блок с пустой
    обязательной связью проверку не проходит, а значит и на страницу не попадёт.
  */
  const relations: Record<string, number | string | undefined> = {};
  for (const collection of ['media', 'playlists', 'threads', 'tags', 'authors', 'specialists']) {
    const found = (await payload
      .find({ collection: collection as never, limit: 1, depth: 0 })
      .catch(() => null)) as { docs?: ReadonlyArray<{ id: number | string }> } | null;
    relations[collection] = found?.docs?.[0]?.id;
  }

  const pick: Pick = { image: images.docs[0]?.id, relations };

  const wanted = PAGE_BLOCKS.filter((block) => !SKIP.has(block.slug));

  payload.logger.info(`Блоков в статье: ${wanted.length}`);
  if (!apply) {
    payload.logger.info(wanted.map((block) => block.slug).join(', '));
    payload.logger.info('Запусти с --apply, чтобы создать статью');
    process.exit(0);
  }

  /*
    Статья собирается по одному блоку: каждый добавляется и сразу записывается.
    Блок, который не прошёл проверку, откатывается и отмечается в списке -
    обычно ему нужны живые данные, каких на стенде нет. Один такой блок
    не должен лишать статью остальных тридцати.
  */
  const intro = [
    paragraph('Статья собрана скриптом для просмотра блоков. Каждый раздел - один блок набора.'),
  ];

  const found = await payload.find({
    collection: 'articles',
    where: { slug: { equals: SLUG } },
    limit: 1,
    depth: 0,
  });

  const base = {
    title: 'Примеры блоков в статье',
    slug: SLUG,
    lead: 'Все блоки набора внутри текста: как они выглядят рядом с абзацами и друг с другом.',
    status: 'published' as const,
    _status: 'published' as const,
  };

  const existing = found.docs[0];
  const id = existing
    ? existing.id
    : (
        await payload.create({
          collection: 'articles',
          data: { ...base, body: lexical(intro) },
          depth: 0,
        })
      ).id;

  if (existing) {
    await payload.update({
      collection: 'articles',
      id,
      data: { ...base, body: lexical(intro) },
      depth: 0,
    });
  }

  const children: Record<string, unknown>[] = [...intro];
  const skipped: string[] = [];

  for (const block of wanted) {
    const label = typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug;
    const next = [
      ...children,
      heading(`${label} (${block.slug})`),
      paragraph('Абзац перед блоком - по нему видно отступы и ширину колонки.'),
      blockNode(blockData(block, pick)),
    ];

    try {
      await payload.update({
        collection: 'articles',
        id,
        data: { ...base, body: lexical(next) },
        depth: 0,
      });
      children.length = 0;
      children.push(...next);
    } catch {
      skipped.push(block.slug);
    }
  }

  payload.logger.info(`Статья готова: /blog/${SLUG}`);
  if (skipped.length > 0) {
    payload.logger.warn(`Не прошли проверку и пропущены: ${skipped.join(', ')}`);
  }

  process.exit(0);
}

void main();
