/**
 * seed-faq — создаёт FAQ-группы и страницу /faq с блоком `faq-accordion`.
 *
 * Источник контента — `veo55/src/articles/faq.html` (legacy Joomla, 3 секции:
 * «О питомнике», «Документы и здоровье», «Выбор и покупка»). Текст — 1:1.
 * Lexical-узлы строим вручную, потому что у Payload нет HTML→Lexical-импорта.
 *
 * Идемпотентен: ищет по `slug` группы → апдейт; страницу — то же.
 *
 * Запуск: pnpm --filter veo55-cms seed:faq
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

// ──────────────────────────────────────────────────────────────────
// Helpers для построения Lexical AST вручную (минимальный набор).
// ──────────────────────────────────────────────────────────────────

type LexInline =
  | {
      type: 'text';
      text: string;
      format?: number;
      mode: 'normal';
      style: '';
      detail: 0;
      version: 1;
    }
  | {
      type: 'link';
      url: string;
      newTab: boolean;
      children: LexInline[];
      fields: { url: string; newTab: boolean; linkType: 'custom' };
      direction: 'ltr';
      format: '';
      indent: 0;
      version: 3;
    };

interface LexParagraph {
  type: 'paragraph';
  children: LexInline[];
  direction: 'ltr';
  format: '';
  indent: 0;
  version: 1;
  textFormat: 0;
  textStyle: '';
}

interface LexListItem {
  type: 'listitem';
  children: LexInline[];
  value: number;
  direction: 'ltr';
  format: '';
  indent: 0;
  version: 1;
}

interface LexList {
  type: 'list';
  listType: 'bullet' | 'number';
  start: 1;
  tag: 'ul' | 'ol';
  children: LexListItem[];
  direction: 'ltr';
  format: '';
  indent: 0;
  version: 1;
}

type LexBlock = LexParagraph | LexList;

const t = (s: string, bold = false): LexInline => ({
  type: 'text',
  text: s,
  format: bold ? 1 : 0,
  mode: 'normal',
  style: '',
  detail: 0,
  version: 1,
});

const link = (url: string, label: string): LexInline => ({
  type: 'link',
  url,
  newTab: true,
  fields: { url, newTab: true, linkType: 'custom' },
  children: [t(label)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 3,
});

const p = (...inline: LexInline[]): LexParagraph => ({
  type: 'paragraph',
  children: inline,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
});

const li = (...inline: LexInline[]): LexListItem => ({
  type: 'listitem',
  children: inline,
  value: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
});

const ul = (...items: LexListItem[]): LexList => ({
  type: 'list',
  listType: 'bullet',
  start: 1,
  tag: 'ul',
  children: items,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
});

const ol = (...items: LexListItem[]): LexList => ({
  type: 'list',
  listType: 'number',
  start: 1,
  tag: 'ol',
  children: items,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
});

const rich = (...blocks: LexBlock[]): unknown => ({
  root: {
    type: 'root',
    children: blocks,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
});

// ──────────────────────────────────────────────────────────────────
// Контент — три группы 1:1 с legacy faq.html.
// ──────────────────────────────────────────────────────────────────

const VK_GROUP_URL = 'https://vk.com/veoomsk';
const VK_DM_URL = 'https://vk.me/veoomsk';

interface SeedItem {
  question: string;
  answer: unknown;
  openByDefault?: boolean;
}

interface SeedGroup {
  slug: string;
  emoji: string;
  title: string;
  order: number;
  items: SeedItem[];
}

const groups: SeedGroup[] = [
  {
    slug: 'about',
    emoji: '🏡',
    title: 'О питомнике',
    order: 10,
    items: [
      {
        question: 'Почему стоит взять щенка именно у нас?',
        openByDefault: true,
        answer: rich(
          ol(
            li(
              t('Мы питомник с большим опытом! '),
              t('Мы любим', true),
              t(' породу ВЕО и особенно '),
              t('наших собак', true),
              t('. Собаки нашего разведения '),
              t('хорошо себя показывают', true),
              t(' как в быту, так и в работе.'),
            ),
            li(
              t('Всегда '),
              t('консультируем клиентов', true),
              t(' по любым вопросам — от выбора щенка до воспитания взрослой собаки, даже '),
              t('после покупки', true),
              t('.'),
            ),
            li(
              t('У нас '),
              link(VK_GROUP_URL, 'большое дружное сообщество'),
              t(
                ' в ВК — там можно общаться с другими владельцами, делиться опытом и получать советы.',
              ),
            ),
          ),
          p(t('Будем рады видеть вас среди нас!')),
        ),
      },
      {
        question: 'Как содержатся ваши собаки?',
        openByDefault: true,
        answer: rich(
          ul(
            li(
              t('Проживание: ', true),
              t('просторные вольеры с тёплыми будками, ежедневные прогулки.'),
            ),
            li(
              t('Питание: ', true),
              t('мясо, рыба, премиальные корма + витамины и микроэлементы.'),
            ),
            li(t('Здоровье: ', true), t('прививки, обработка от паразитов, ветосмотры.')),
            li(t('Дрессировка: ', true), t('ОКД, ЗКС, социализация с щенячества.')),
            li(
              t('Щенки: ', true),
              t('растут в доме, привыкают к людям, шуму. Когда подрастают — переезжают в вольер.'),
            ),
          ),
        ),
      },
    ],
  },
  {
    slug: 'documents',
    emoji: '📋',
    title: 'Документы и здоровье',
    order: 20,
    items: [
      {
        question: 'Есть ли у щенков документы?',
        answer: rich(
          p(
            t('Да! Все щенки имеют щенячьи карточки '),
            t('РКФ-FCI', true),
            t(
              ' (меняются на родословную). Родители прошли тестирование и допущены к разведению. Также родителям сделаны генетические тесты и снимки суставов на дисплазию.',
            ),
          ),
        ),
      },
      {
        question: 'Зачем нужны документы РКФ-FCI?',
        answer: rich(
          p(t('Документы — это '), t('гарантия', true), t(':')),
          ul(
            li(t('Подтверждённая '), t('чистота породы', true), t(' и родословная.')),
            li(
              t(
                'Известное происхождение, родители проверены — меньше риск наследственных болезней.',
              ),
            ),
            li(
              t('Возможность участия в '),
              t('выставках, соревнованиях', true),
              t(' и разведении.'),
            ),
          ),
        ),
      },
    ],
  },
  {
    slug: 'choice',
    emoji: '🐶',
    title: 'Выбор и покупка',
    order: 30,
    items: [
      {
        question: 'Какой щенок мне подойдёт?',
        answer: rich(
          p(
            t('Все щенки разные! У нас есть кобели и суки трёх окрасов: '),
            t('чепрачный, чёрный, зонарный', true),
            t(
              '. Уже в 1,5 месяца виден характер. Расскажите, для чего вам собака (компаньон, выставки, спорт, охрана), — и мы подберём идеальный вариант.',
            ),
          ),
        ),
      },
      {
        question: 'Когда и как можно забрать щенка?',
        answer: rich(
          p(
            t('Щенков можно забирать с '),
            t('45-дневного возраста', true),
            t(', после первой вакцинации.'),
          ),
          p(
            t('Если вы '),
            t('не из Омска', true),
            t(' — напишите нам, мы проконсультируем по возможной доставке щенка '),
            t('поездом', true),
            t(' и её стоимости.'),
          ),
        ),
      },
      {
        question: 'Как часто у вас бывают щенки и можно ли забронировать?',
        answer: rich(
          p(
            t('Мы вяжем собак '),
            t('осознанно — примерно 1 раз в год', true),
            t(', чтобы сохранить качество породы и заботу о собаках-мамах.'),
          ),
          p(
            t('После того как помёт родился', true),
            t(', мы открываем '),
            t('бронирование', true),
            t(
              ' — так фиксируется ваша очередь выбора щенка (или сразу конкретный, если уже определились).',
            ),
          ),
          p(
            t(
              'И ещё один момент: бронь — это не гарантия покупки. Иногда планы у людей меняются, и забронированные щенки ',
            ),
            t('снова становятся свободными', true),
            t(
              '. Так что если на первый взгляд всё разобрали — стоит всё равно следить за нашими постами, может освободиться место.',
            ),
          ),
          p(
            t(
              'Все анонсы новых помётов, открытие бронирования и освободившиеся щенки появляются первым делом в нашей группе ',
            ),
            link(VK_GROUP_URL, '«Омская Дружина» во ВКонтакте'),
            t(' — подпишитесь, чтобы не пропустить момент.'),
          ),
        ),
      },
    ],
  },
];

const faqPageBlocks = [
  {
    blockType: 'faq-accordion' as const,
    title: 'Что нужно знать будущим владельцам ВЕО?',
    titleEmoji: '🐾',
    lead: 'Короткие ответы на самые частые вопросы про щенков восточноевропейской овчарки в питомнике «Омская Дружина».',
    showChips: true,
    cta: {
      text: 'Не нашли ответ на свой вопрос?',
      linkLabel: '✉ Написать нам в VK',
      linkHref: VK_DM_URL,
    },
  },
];

async function main() {
  console.log('[seed:faq] starting…');
  const payload = await getPayload({ config });

  // --- Upsert groups ---
  for (const g of groups) {
    const existing = await payload.find({
      collection: 'faq-groups',
      where: { slug: { equals: g.slug } },
      limit: 1,
      depth: 0,
    });
    if (existing.docs.length > 0) {
      const cur = existing.docs[0]!;
      await payload.update({
        collection: 'faq-groups',
        id: cur.id,
        data: {
          order: g.order,
          emoji: g.emoji,
          title: g.title,
          slug: g.slug,
          items: g.items,
          _status: 'published',
        } as never,
        draft: false,
      });
      console.log(`[seed:faq] updated group "${g.slug}" id=${cur.id}`);
    } else {
      const created = await payload.create({
        collection: 'faq-groups',
        data: {
          order: g.order,
          emoji: g.emoji,
          title: g.title,
          slug: g.slug,
          items: g.items,
          _status: 'published',
        } as never,
      });
      console.log(`[seed:faq] created group "${g.slug}" id=${created.id}`);
    }
  }

  // --- Upsert /faq page ---
  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'faq' } },
    limit: 1,
    depth: 0,
  });
  if (existingPage.docs.length > 0) {
    const page = existingPage.docs[0]!;
    await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        title: 'Ответы на вопросы',
        blocks: faqPageBlocks,
        _status: 'published',
      } as never,
      draft: false,
    });
    console.log(`[seed:faq] updated /faq page id=${page.id}`);
  } else {
    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Ответы на вопросы',
        slug: 'faq',
        blocks: faqPageBlocks,
        _status: 'published',
      } as never,
    });
    console.log(`[seed:faq] created /faq page id=${created.id}`);
  }

  console.log('[seed:faq] OK.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:faq] FAILED:', err);
  process.exit(1);
});
