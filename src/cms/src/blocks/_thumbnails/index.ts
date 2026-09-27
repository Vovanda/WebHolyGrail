import type { Block } from 'payload';

import {
  H,
  W,
  bar,
  box,
  button,
  chevron,
  dot,
  dots,
  frame,
  lines,
  picture,
  play,
  svg,
} from './draw';

/**
 * Схемы блоков для окна выбора в админке.
 *
 * @remarks
 * Каждая схема повторяет устройство блока на сайте: где заголовок, где сетка,
 * где картинка. Без неё Payload ставит всем блокам одну и ту же заглушку,
 * и выбирать приходится по названию.
 *
 * Блок без схемы здесь остаётся с заглушкой: новый блок ничего не ломает,
 * схема дописывается в эту таблицу, когда до неё дошли.
 */
const SCHEMES: Record<string, () => string[]> = {
  // Крупный заголовок и подзаголовок по центру, под ними акцентная черта.
  hero: () => [
    bar(40, 48, 160, 'ink', 14),
    bar(70, 70, 100, 'ink', 14),
    bar(50, 96, 140),
    bar(104, 116, 32, 'accent', 3),
  ],

  // Заголовок секции и карточки 3×2: кружок-иконка, название, описание.
  'feature-grid': () => {
    const parts = [bar(80, 14, 80, 'ink', 8)];
    const cw = 68;
    const ch = 56;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = 14 + col * (cw + 8);
        const y = 34 + row * (ch + 8);
        parts.push(
          frame(x, y, cw, ch),
          dot(x + cw / 2, y + 14, 6),
          bar(x + 14, y + 26, cw - 28, 'ink', 5),
          bar(x + 10, y + 36, cw - 20, 'soft', 4),
          bar(x + 18, y + 44, cw - 36, 'soft', 4),
        );
      }
    }
    return parts;
  },

  // Залитая акцентом плашка: заголовок, строка текста и светлая кнопка.
  'cta-banner': () => [
    `<rect x="14" y="28" width="${W - 28}" height="${H - 56}" rx="8" fill="#4a90d9" fill-opacity="0.85"/>`,
    `<rect x="54" y="50" width="132" height="12" rx="6" fill="#fff" fill-opacity="0.92"/>`,
    `<rect x="70" y="70" width="100" height="6" rx="3" fill="#fff" fill-opacity="0.6"/>`,
    `<rect x="92" y="88" width="56" height="14" rx="7" fill="#fff" fill-opacity="0.95"/>`,
  ],

  // Вопросы строками; первый раскрыт и показывает ответ.
  'faq-accordion': () => {
    const parts = [bar(20, 16, 96, 'ink', 8)];
    let y = 32;
    for (let i = 0; i < 4; i++) {
      const open = i === 0;
      const h = open ? 44 : 20;
      parts.push(frame(20, y, W - 40, h), bar(30, y + 8, open ? 120 : 100 + i * 12, 'ink', 6));
      parts.push(
        `<path d="M${W - 36} ${y + (open ? 13 : 9)} l4 ${open ? -3 : 3} l4 ${open ? 3 : -3}" fill="none" stroke="#8b96a3" stroke-width="1.6" stroke-linecap="round"/>`,
      );
      if (open) parts.push(lines(30, y + 22, 160, 2, 9));
      y += h + 5;
    }
    return parts;
  },

  // Кадры рядами разной ширины - как галерея раскладывает снимки по пропорциям.
  gallery: () => [
    picture(14, 16, 124, 62),
    picture(144, 16, 82, 62),
    picture(14, 84, 70, 60),
    picture(90, 84, 70, 60),
    picture(166, 84, 60, 60),
  ],

  // Полоса: значок, крупная цифра с подписью, ниже пункты достижения.
  'achievement-banner': () => [
    box(14, 30, W - 28, 100, 'faint', 8),
    dot(44, 62, 14),
    bar(68, 52, 90, 'ink', 14),
    bar(162, 56, 40, 'accent', 8),
    bar(68, 74, 130),
    bar(28, 104, 54, 'soft', 10),
    bar(90, 104, 62, 'soft', 10),
    bar(160, 104, 50, 'soft', 10),
  ],

  // Заголовок секции и три карточки статей: обложка, название, строка.
  'articles-section': () => cardsRow(3, true),

  // Широкий баннер во всю ширину, стрелки по бокам, точки снизу.
  'banner-slider': () => [
    picture(14, 18, W - 28, 112, 6),
    chevron(28, 74, 'left'),
    chevron(W - 28, 74, 'right'),
    dots(W / 2, 144, 4),
  ],

  // Заголовок и карточки сайтов: снимок экрана и имя.
  'built-with': () => [
    bar(70, 16, 100, 'ink', 8),
    ...[0, 1, 2].flatMap((i) => {
      const x = 14 + i * 74;
      return [
        frame(x, 36, 66, 96),
        picture(x + 5, 41, 56, 58, 3),
        bar(x + 10, 108, 46, 'ink', 5),
        bar(x + 14, 118, 38, 'soft', 4),
      ];
    }),
  ],

  // Лента карточек, третья уходит за край; стрелки и точки.
  carousel: () => [
    bar(20, 16, 90, 'ink', 8),
    ...[0, 1, 2].flatMap((i) => {
      const x = 20 + i * 84;
      return [picture(x, 34, 76, 58, 4), bar(x, 100, 60, 'ink', 5), bar(x, 110, 70, 'soft', 4)];
    }),
    chevron(20, 63, 'left'),
    chevron(W - 20, 63, 'right'),
    dots(W / 2, 140, 3),
  ],

  // Рамка статуса: надпись над заголовком, текст, список условий с галочками.
  'certified-notice': () => [
    frame(20, 16, W - 40, 128, 8),
    bar(34, 30, 50, 'accent', 5),
    bar(34, 42, 130, 'ink', 9),
    bar(34, 60, 160),
    ...[0, 1, 2].flatMap((i) => [check(40, 84 + i * 16), bar(52, 81 + i * 16, 110 - i * 14)]),
  ],

  // Одна складная секция: строка заголовка со стрелкой и открытый текст.
  collapsible: () => [
    frame(20, 36, W - 40, 88, 6),
    bar(34, 50, 110, 'ink', 7),
    `<path d="M${W - 42} 56 l5 -4 l5 4" fill="none" stroke="#8b96a3" stroke-width="1.6" stroke-linecap="round"/>`,
    lines(34, 74, 170, 4, 10),
  ],

  // Две колонки «было» и «стало»: слева крестики, справа галочки.
  'comparison-table': () => [
    bar(60, 14, 120, 'ink', 8),
    box(14, 32, 102, 114, 'faint', 6),
    box(124, 32, 102, 114, 'faint', 6),
    bar(26, 42, 44, 'soft', 6),
    bar(136, 42, 44, 'accent', 6),
    ...[0, 1, 2, 3].flatMap((i) => [
      cross(30, 68 + i * 20),
      bar(40, 65 + i * 20, 62),
      check(142, 68 + i * 20),
      bar(152, 65 + i * 20, 62),
    ]),
  ],

  // Своя разметка: угловые скобки кода.
  'custom-markup': () => [
    frame(40, 30, W - 80, 100, 8),
    `<path d="M98 62 L78 80 L98 98 M142 62 L162 80 L142 98 M126 56 L114 104" fill="none" stroke="#4a90d9" stroke-opacity="0.85" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  ],

  // Заголовок и строки документов: значок листа, название, пометка.
  'document-list': () => [
    bar(20, 16, 100, 'ink', 8),
    ...[0, 1, 2, 3].flatMap((i) => {
      const y = 36 + i * 28;
      return [
        frame(20, y, W - 40, 22),
        docIcon(30, y + 4),
        bar(48, y + 6, 100, 'ink', 5),
        bar(48, y + 14, 60, 'soft', 3),
      ];
    }),
  ],

  // Обложка во весь экран: видео с затемнением, заголовок и кнопка слева снизу.
  'hero-cinematic': () => [
    picture(8, 8, W - 16, H - 16, 6),
    `<rect x="8" y="8" width="${W - 16}" height="${H - 16}" rx="6" fill="#1b2430" fill-opacity="0.45"/>`,
    `<rect x="22" y="92" width="130" height="12" rx="6" fill="#fff" fill-opacity="0.9"/>`,
    `<rect x="22" y="110" width="90" height="6" rx="3" fill="#fff" fill-opacity="0.6"/>`,
    button(22, 126, 48),
  ],

  // Слева заголовок, текст и две кнопки; справа панель с шагами.
  'hero-split': () => [
    bar(14, 38, 100, 'ink', 12),
    bar(14, 56, 80, 'accent', 12),
    lines(14, 78, 100, 2, 9),
    button(14, 104, 50),
    `<rect x="70" y="104" width="46" height="12" rx="6" fill="none" stroke="#8b96a3" stroke-opacity="0.7"/>`,
    box(128, 26, 98, 108, 'faint', 8),
    ...[0, 1, 2].flatMap((i) => [
      dot(142, 50 + i * 28, 6),
      bar(154, 46 + i * 28, 56, 'ink', 5),
      bar(154, 55 + i * 28, 40, 'soft', 3),
    ]),
  ],

  // Команда для терминала: тёмная плашка, приглашение, строка, кнопка копирования.
  'install-snippet': () => [
    `<rect x="20.5" y="56.5" width="${W - 41}" height="39" rx="8" fill="#1b2430" fill-opacity="0.8" stroke="#8b96a3" stroke-opacity="0.55"/>`,
    `<path d="M34 70 l6 6 l-6 6" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linecap="round"/>`,
    `<rect x="48" y="73" width="120" height="6" rx="3" fill="#fff" fill-opacity="0.7"/>`,
    `<rect x="190" y="68" width="12" height="14" rx="2" fill="none" stroke="#fff" stroke-opacity="0.6"/><rect x="194" y="65" width="12" height="14" rx="2" fill="none" stroke="#fff" stroke-opacity="0.6"/>`,
    bar(20, 108, 90),
  ],

  // Содержимое другой страницы: лист со стрелкой-ссылкой.
  'page-ref': () => [
    frame(70, 22, 100, 116, 6),
    bar(84, 38, 60, 'ink', 7),
    lines(84, 56, 72, 5, 11),
    `<circle cx="170" cy="128" r="16" fill="#4a90d9" fill-opacity="0.85"/>`,
    `<path d="M163 135 L177 121 M167 121 H177 V131" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  ],

  // Абзацы текста узкой колонкой.
  prose: () => [lines(50, 26, 140, 4, 11), lines(50, 80, 140, 4, 11)],

  // Крупная кавычка, текст отзыва, аватар и имя.
  quote: () => [
    `<text x="34" y="66" font-family="Georgia, serif" font-size="64" fill="#4a90d9" fill-opacity="0.85">“</text>`,
    lines(70, 40, 140, 3, 12),
    dot(80, 110, 10, 'soft'),
    bar(96, 104, 60, 'ink', 6),
    bar(96, 114, 40, 'soft', 4),
  ],

  // Отзыв, который сменяется по кругу: цитата и точки.
  'quote-cycle': () => [
    `<text x="34" y="66" font-family="Georgia, serif" font-size="64" fill="#4a90d9" fill-opacity="0.85">“</text>`,
    lines(70, 40, 140, 3, 12),
    bar(70, 88, 70, 'ink', 6),
    dots(W / 2, 128, 4, 1),
  ],

  // Заголовок, поля формы и кнопка отправки.
  'request-form': () => [
    bar(50, 14, 140, 'ink', 9),
    frame(40, 34, 76, 20),
    frame(124, 34, 76, 20),
    frame(40, 60, 160, 20),
    frame(40, 86, 160, 34),
    button(40, 128, 70, 'accent', 14),
  ],

  // Общая секция: одна и та же секция на нескольких страницах.
  'reusable-ref': () => [
    frame(24, 38, 80, 84, 6),
    frame(136, 38, 80, 84, 6),
    box(34, 70, 60, 24, 'accent', 4),
    box(146, 70, 60, 24, 'accent', 4),
    `<path d="M96 82 H144" fill="none" stroke="#8b96a3" stroke-width="1.6" stroke-dasharray="4 4"/>`,
  ],

  // Текст со своим заголовком, абзацем и списком.
  'rich-text': () => [
    bar(40, 22, 110, 'ink', 10),
    lines(40, 44, 160, 3, 10),
    ...[0, 1, 2].flatMap((i) => [
      dot(46, 90 + i * 14, 3, 'ink'),
      bar(56, 87 + i * 14, 120 - i * 20),
    ]),
  ],

  // Фильтры сверху и посты сеткой: автор, текст, картинка.
  'social-feed': () => [
    bar(14, 14, 40, 'accent', 10),
    bar(60, 14, 40, 'soft', 10),
    bar(106, 14, 40, 'soft', 10),
    ...[0, 1, 2].flatMap((i) => {
      const x = 14 + i * 74;
      return [
        frame(x, 34, 66, 112),
        dot(x + 12, 46, 6, 'soft'),
        bar(x + 22, 43, 36, 'ink', 5),
        bar(x + 8, 58, 50),
        bar(x + 8, 68, 40),
        picture(x + 6, 80, 54, 58, 3),
      ];
    }),
  ],

  // Заголовок и значки технологий рядами.
  'stack-transparency': () => [
    bar(60, 18, 120, 'ink', 8),
    ...[0, 1].flatMap((row) =>
      [0, 1, 2, 3].flatMap((col) => {
        const x = 18 + col * 52;
        const y = 44 + row * 48;
        return [
          box(x, y, 46, 40, 'faint', 6),
          dot(x + 23, y + 15, 7, row === 0 && col === 0 ? 'accent' : 'soft'),
          bar(x + 8, y + 28, 30, 'ink', 4),
        ];
      }),
    ),
  ],

  // Серии: карточки стопкой, у каждой название и число записей.
  'threads-section': () => [
    bar(20, 16, 100, 'ink', 8),
    ...[0, 1, 2].flatMap((i) => {
      const x = 16 + i * 74;
      return [
        box(x + 6, 36, 60, 90, 'faint', 5),
        frame(x, 42, 64, 92, 5),
        bar(x + 8, 54, 44, 'ink', 6),
        lines(x + 8, 70, 48, 3, 9),
        bar(x + 8, 116, 24, 'accent', 5),
      ];
    }),
  ],

  // Вертикальная линия с метками лет и текстом у каждой.
  timeline: () => [
    `<path d="M60 20 V140" stroke="#8b96a3" stroke-opacity="0.5" stroke-width="2"/>`,
    ...[0, 1, 2, 3].flatMap((i) => {
      const y = 30 + i * 32;
      return [
        bar(18, y - 3, 28, 'accent', 7),
        dot(60, y, 6, i === 0 ? 'accent' : 'soft'),
        bar(76, y - 6, 110, 'ink', 6),
        bar(76, y + 4, 130),
      ];
    }),
  ],

  // Видео 16:9 с кнопкой воспроизведения и подписью.
  video: () => [
    picture(30, 16, 180, 102, 6),
    play(120, 67, 14),
    bar(30, 128, 120, 'ink', 7),
    bar(30, 140, 80),
  ],

  // Плеер и список видео рядом.
  videoSet: () => [
    picture(14, 20, 140, 80, 6),
    play(84, 60, 12),
    bar(14, 108, 110, 'ink', 7),
    bar(14, 120, 80),
    ...[0, 1, 2, 3].flatMap((i) => [
      picture(162, 20 + i * 30, 30, 24, 3),
      bar(196, 24 + i * 30, 30, 'ink', 4),
      bar(196, 32 + i * 30, 22, 'soft', 3),
    ]),
  ],

  // Разделитель: волна поперёк страницы.
  'wave-divider': () => [
    `<path d="M0 90 C 40 60, 80 60, 120 85 S 200 110, 240 80 V160 H0 Z" fill="#4a90d9" fill-opacity="0.35"/>`,
    `<path d="M0 105 C 50 80, 90 85, 130 100 S 200 120, 240 98 V160 H0 Z" fill="#8b96a3" fill-opacity="0.35"/>`,
  ],
};

/** Карточки рядом под заголовком секции: обложка, название, строка. */
function cardsRow(count: number, withPicture: boolean): string[] {
  const gap = 8;
  const cw = (W - 28 - gap * (count - 1)) / count;
  const parts = [bar(14, 16, 100, 'ink', 8)];
  for (let i = 0; i < count; i++) {
    const x = 14 + i * (cw + gap);
    if (withPicture) parts.push(picture(x, 34, cw, 62, 4));
    parts.push(bar(x, 104, cw * 0.85, 'ink', 6), lines(x, 116, cw, 2, 9));
  }
  return parts;
}

function check(x: number, y: number): string {
  return `<path d="M${x - 4} ${y} l3 3 l6 -6" fill="none" stroke="#4a90d9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function cross(x: number, y: number): string {
  return `<path d="M${x - 3} ${y - 3} l6 6 M${x + 3} ${y - 3} l-6 6" fill="none" stroke="#8b96a3" stroke-width="1.8" stroke-linecap="round"/>`;
}

function docIcon(x: number, y: number): string {
  return `<path d="M${x} ${y} h8 l4 4 v10 h-12 Z" fill="#8b96a3" fill-opacity="0.35"/><path d="M${x + 8} ${y} v4 h4" fill="none" stroke="#8b96a3" stroke-opacity="0.8"/>`;
}

export const BLOCK_THUMBNAILS = SCHEMES;

/**
 * Ставит блоку схему в окно выбора, если она нарисована.
 *
 * @remarks
 * Доменный блок сайта передаёт свою схему вторым аргументом: таблица здесь
 * едет синком на все сайты, а чужому сайту схема чужого блока не нужна.
 */
export function withThumbnail(
  block: Block,
  scheme: (() => string[]) | undefined = SCHEMES[block.slug],
): Block {
  if (!scheme) return block;
  const label = typeof block.labels?.singular === 'string' ? block.labels.singular : block.slug;
  return {
    ...block,
    admin: {
      ...block.admin,
      images: {
        ...block.admin?.images,
        thumbnail: { url: svg(scheme()), alt: `Схема блока «${label}»` },
      },
    },
  };
}

export { H, W };
