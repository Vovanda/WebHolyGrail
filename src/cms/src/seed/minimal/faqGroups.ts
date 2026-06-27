import { paragraphs, type LexicalDoc } from './lexical.js';

type FaqItem = {
  question: string;
  answer: LexicalDoc;
  openByDefault?: boolean;
};

export type FaqGroupSeed = {
  slug: string;
  order: number;
  emoji: string;
  title: string;
  items: FaqItem[];
};

export const FAQ_GROUPS: FaqGroupSeed[] = [
  {
    slug: 'business',
    order: 10,
    emoji: '💼',
    title: 'Бизнесу',
    items: [
      {
        question: 'Чем лучше конструкторов (Тильда, Wix)?',
        openByDefault: true,
        answer: paragraphs(
          'Конструктор — это монолит чужой платформы: делаете только то, что в ней предусмотрено, контент живёт у них.',
          'WHG — собственный сайт на вашем сервере. Контент в своей базе: убрали товар — он не пропал, а ушёл в архив. Понадобился — вернули. Со временем у вас остаётся своя база товаров, заявок и клиентов.',
        ),
      },
      {
        question: 'Чем лучше WordPress / Joomla / Битрикс?',
        answer: paragraphs(
          'Другая модель. WP/Битрикс — PHP-монолит с экосистемой плагинов: гибко, но обвешивается со временем. WHG — TypeScript-first, schema-driven, без runtime-плагинов.',
          'На старте встроенной CMS достаточно для большинства задач. Когда понадобится больше — рядом достраивается бэкенд или CRM с интеграциями (1С, оплата, любые сервисы), не ломая остальной сайт.',
        ),
      },
      {
        question: 'Сам смогу обновлять сайт?',
        answer: paragraphs(
          'Да. Фото, цены, тексты, статусы — через админку Payload, прямо с телефона. Программист для этого не нужен.',
        ),
      },
      {
        question: 'А вдруг я что-то сломаю?',
        answer: paragraphs(
          'Контент и вёрстка разделены. Правки текста и картинок вёрстку не ломают.',
          'Изменения сохраняются как черновики и публикуются явно — есть куда откатиться.',
        ),
      },
      {
        question: 'Сколько это стоит?',
        answer: paragraphs(
          'Только ваш сервер — от ~1000 ₽/мес, на нём спокойно живёт несколько таких сайтов параллельно. Никаких подписок за сам сайт: он ваш.',
        ),
      },
      {
        question: 'Придётся каждый раз звать программиста?',
        answer: paragraphs(
          'Нет. Повседневное вы делаете сами. Разработчик нужен, когда захотите добавить что-то крупное — новый блок, интеграцию, личный кабинет.',
        ),
      },
      {
        question: 'А если бизнес вырастет — переделывать с нуля?',
        answer: paragraphs(
          'Нет. Блог, услуги, онлайн-запись, личный кабинет, новые сервисы — всё достраивается на том же фундаменте, без переезда.',
        ),
      },
    ],
  },
  {
    slug: 'developers',
    order: 20,
    emoji: '🧑‍💻',
    title: 'Разработчикам',
    items: [
      {
        question: 'Что под капотом?',
        openByDefault: true,
        answer: paragraphs(
          'Next 15 + Payload 3 в монорепо. Готово: коллекции, блоки, contracts-слой типов, Docker-деплой с blue-green, S3-хранилище (MinIO/B2/R2/AWS), Infisical-секреты.',
          'Вы пишете свою логику, не собираете фундамент заново.',
        ),
      },
      {
        question: 'Сложно ли поднять?',
        answer: paragraphs(
          'Dev — минуты: pnpm install && pnpm setup-infisical && ./dev-setup.sh && ./dev.sh.',
          'Prod на VPS — первый раз ~30–40 минут (Docker, домен, certbot, Infisical client). С готовыми Claude Code skills (.claude/skills/whg-*) большая часть автоматизирована.',
        ),
      },
      {
        question: 'С чего начать новый блок?',
        answer: paragraphs(
          'Блок описывается в двух местах: схема полей — в src/cms/src/blocks/<Name>.ts, рендер — в src/client/src/blocks/<name>.tsx.',
          'После регистрации в blocks/index.ts он сразу доступен в конструкторе страниц Payload.',
        ),
      },
      {
        question: 'Можно ли разрабатывать вместе с ИИ?',
        answer: paragraphs(
          'Да. В репозитории — .claude/skills/whg-* с workflow-ами (rules, layouts, modals, scaffold, миграции, jobs, infisical, template-sync).',
          'Архитектурные правила R1–R9 — в docs/whg/30-philosophy.md. ИИ-агент держится курса, а не фантазирует.',
        ),
      },
      {
        question: 'Как разделены фронт и CMS?',
        answer: paragraphs(
          'Через contracts/ — workspace типов. Фронт импортирует только из contracts, не лезет в src/cms/ напрямую. Слои развиваются независимо (правило R3).',
        ),
      },
      {
        question: 'Как выкатывать обновления?',
        answer: paragraphs(
          'Blue-green: рядом поднимается новая версия, проходит healthcheck — nginx переключает upstream. Без даунтайма.',
          'Откат — флип ACTIVE_COLOR обратно.',
        ),
      },
    ],
  },
  {
    slug: 'tech',
    order: 30,
    emoji: '⚙️',
    title: 'Технологии и ресурсы',
    items: [
      {
        question: 'Сколько ресурсов потребляет?',
        openByDefault: true,
        answer: paragraphs(
          'Замерено на боевом VPS (4 ядра / 8 ГБ, один сайт):',
          '• client (Next 15 SSR) ≈ 324 МБ',
          '• CMS (Payload 3) ≈ 490 МБ',
          '• итого ~815 МБ на сайт, CPU почти ноль',
          '• shared платформа (Infisical API + Postgres + Redis + host-nginx) ≈ 840 МБ — на всю платформу один раз, не на сайт',
          'В сумме при одном сайте — ~1.65 ГБ из 8 ГБ. Load average 0.07. Машина выглядит простаивающей.',
        ),
      },
      {
        question: 'Сколько сайтов потянет один VPS?',
        answer: paragraphs(
          'Тот же 4-ядерный / 8 ГБ VPS вмещает 5–6 таких сайтов параллельно.',
          'Каждый дополнительный сайт прибавляет ~815 МБ — shared Infisical не дублируется.',
        ),
      },
      {
        question: 'SQLite — это несерьёзно?',
        answer: paragraphs(
          'Для большинства сайтов это то, что нужно: быстрое чтение, бэкап одним файлом, ноль настроек.',
          'Перерастёте — замена адаптера в payload.config.ts (sqliteAdapter → postgresAdapter) + пакет @payloadcms/db-postgres + миграции. Без переписывания фронта.',
        ),
      },
      {
        question: 'Blue-green деплой — не слишком тяжело?',
        answer: paragraphs(
          'Во время деплоя ненадолго работают две копии — двойная RAM на сайт ~2–3 минуты.',
          'Зато обновление без даунтайма.',
        ),
      },
      {
        question: 'Зачем отдельное хранилище секретов?',
        answer: paragraphs(
          'Секреты есть у всех, и хранить их надо правильно. Здесь они лежат в отдельном защищённом хранилище с управлением через панель — это делает ваш сайт защищённым и легко управляемым.',
          'И одно хранилище на все сайты, а не на каждый отдельно.',
        ),
      },
      {
        question: 'Проект новый — не сырой ли он?',
        answer: paragraphs(
          'Ядро рабочее, на нём живёт боевой сайт.',
          'В roadmap — project-type пресеты (business-card / blog / portal), визуальный конструктор блоков, интеграции (Telegram-sync, авто-импорт заявок из соцсетей).',
        ),
      },
    ],
  },
];
