import type { CollectionConfig } from 'payload';

/**
 * Litters — помёты. Структурная единица разведения у ВЕО (литера Н, О, П…).
 *
 * @remarks
 * **Зачем отдельная сущность вместо плоских Puppies:** у помёта есть общие
 * поля (мама, папа, визитка, описание, флаги, статус), которые с плоским
 * Puppies дублировались бы в каждом из 8-10 щенков. Litters хранит их один
 * раз и связывает массивом nested puppies (см. контракт `@veo55/litters`).
 *
 * **Архивация целиком:** один клик `status = 'archived'` — помёт уходит со
 * страницы /puppies на /puppies/archive. `hidden` — не рендерится нигде.
 *
 * **«Нестандартная» секция помёта** (например рамка «отборное поведение
 * Чипсы»): кладётся **рядом** с блоком LitterCard на странице помёта в
 * `Pages.blocks[]` как обычный Prose/Quote. Сама коллекция остаётся простой,
 * гибкость — на уровне композиции страницы.
 */
export const Litters: CollectionConfig = {
  slug: 'litters',
  labels: { singular: 'Помёт', plural: 'Помёты' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'dob', 'status', 'updatedAt'],
    group: 'Питомник',
    description:
      'Помёт = группа щенков от одной пары. Заводится один раз на литеру (Н, О, П…). Щенки внутри — nested array, не отдельная коллекция.',
  },
  versions: {
    drafts: {
      autosave: { interval: 800 },
    },
    maxPerDoc: 30,
  },
  fields: [
    {
      name: 'title',
      label: 'Заголовок помёта',
      type: 'text',
      required: true,
      admin: { description: 'Отображается в шапке секции и в админ-списке.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dob',
          label: 'Дата рождения',
          type: 'date',
          // Не required: для анонсов (вязка ещё не было / только планируется)
          // даты ещё нет. Текстовое описание — в `dobApprox`.
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'dd.MM.yyyy' },
            width: '50%',
            description:
              'Пусто = анонс / планируется. Тогда в `dobApprox` напиши примерно («весна 2026», «после вязки осенью»).',
          },
        },
        {
          name: 'letter',
          label: 'Литера (буква помёта)',
          type: 'select',
          // Не required: пока не родились — литера ещё неизвестна.
          index: true,
          options: [
            { label: 'А', value: 'a' },
            { label: 'Б', value: 'b' },
            { label: 'В', value: 'v' },
            { label: 'Г', value: 'g' },
            { label: 'Д', value: 'd' },
            { label: 'Е', value: 'e' },
            { label: 'Ё', value: 'yo' },
            { label: 'Ж', value: 'zh' },
            { label: 'З', value: 'z' },
            { label: 'И', value: 'i' },
            { label: 'Й', value: 'y' },
            { label: 'К', value: 'k' },
            { label: 'Л', value: 'l' },
            { label: 'М', value: 'm' },
            { label: 'Н', value: 'n' },
            { label: 'О', value: 'o' },
            { label: 'П', value: 'p' },
            { label: 'Р', value: 'r' },
            { label: 'С', value: 's' },
            { label: 'Т', value: 't' },
            { label: 'У', value: 'u' },
            { label: 'Ф', value: 'f' },
            { label: 'Х', value: 'h' },
            { label: 'Ц', value: 'ts' },
            { label: 'Ч', value: 'ch' },
            { label: 'Ш', value: 'sh' },
            { label: 'Щ', value: 'sch' },
            { label: 'Э', value: 'eh' },
            { label: 'Ю', value: 'yu' },
            { label: 'Я', value: 'ya' },
          ],
          admin: {
            description:
              'URL: `/puppies/{дата}/{буква}` когда есть. Анонс без даты/буквы — URL не генерируется, помёт виден только на главной/архиве.',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'dobApprox',
      label: 'Примерная дата (текстом)',
      type: 'text',
      admin: {
        description:
          'Заполняется только когда `dob` пуст. Например: «весна 2026», «после вязки осенью», «дата уточняется».',
      },
    },
    {
      name: 'pageLink',
      type: 'ui',
      admin: {
        components: {
          Field: '/admin/components/LitterPageButton#default',
        },
      },
    },
    {
      name: 'status',
      label: 'Статус',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Активный (на сайте)', value: 'active' },
        { label: 'В архиве', value: 'archived' },
        { label: 'Скрыт (черновик/не показывать)', value: 'hidden' },
      ],
      admin: {
        description:
          'Активный — отображается на /puppies и на главной (если выставлен). В архиве — попадает в /puppies/archive, не на главной. Скрыт — не отображается нигде.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'mother',
          label: 'Мать',
          type: 'relationship',
          relationTo: 'dogs',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'father',
          label: 'Отец',
          type: 'relationship',
          relationTo: 'dogs',
          required: true,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'pairCard',
      label: 'Визитка пары',
      type: 'group',
      admin: {
        description:
          'Графическая карточка пары родителей с регалиями (традиционно собирается в Canva). Можно несколько вариантов — отрисуются галереей. Пусто — карточка не показывается.',
      },
      fields: [
        {
          name: 'images',
          label: 'Картинки визитки',
          type: 'array',
          labels: { singular: 'Картинка', plural: 'Картинки' },
          admin: {
            description:
              'Одна или несколько визиток. Порядок отображения = порядок в списке. Первая считается основной для превью.',
          },
          fields: [
            {
              name: 'image',
              label: 'Файл',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
          ],
        },
        {
          name: 'caption',
          label: 'Подпись под визиткой',
          type: 'text',
          admin: {
            description: 'Опционально. Краткие регалии пары / дата вязки / комментарий.',
          },
        },
      ],
    },
    {
      name: 'description',
      label: 'Описание помёта',
      type: 'richText',
      admin: {
        description: 'Текст под визиткой пары. Можно оставить пустым.',
      },
    },
    {
      type: 'collapsible',
      label: 'Что показывать о родителях',
      admin: {
        description:
          'Дополнительно к именам родителей в карточке помёта можно показать их регалии и описание (берётся из самих записей Собак). Удобно прятать длинное описание если оно дублирует визитку.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'showMotherTitles',
              label: 'Регалии матери',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '50%' },
            },
            {
              name: 'showMotherDescription',
              label: 'Описание матери',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'showFatherTitles',
              label: 'Регалии отца',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '50%' },
            },
            {
              name: 'showFatherDescription',
              label: 'Описание отца',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'puppies',
      label: 'Щенки',
      type: 'array',
      labels: { singular: 'Щенок', plural: 'Щенки' },
      admin: {
        description:
          'Карточки щенков на витрине. Порядок отображения = порядок в списке. Статус «Продан» по умолчанию скрыт с сайта, «Скрыт» — скрыт всегда.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Кличка / прозвище',
              type: 'text',
              admin: { width: '50%' },
            },
            {
              name: 'sex',
              label: 'Пол',
              type: 'select',
              required: true,
              options: [
                { label: 'Кобель', value: 'male' },
                { label: 'Сука', value: 'female' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'color',
              label: 'Окрас',
              type: 'select',
              options: [
                { label: 'Чепрачный', value: 'cheprachny' },
                { label: 'Зонарный', value: 'zonarny' },
                { label: 'Чёрный', value: 'cherny' },
              ],
              admin: { width: '50%' },
            },
            {
              name: 'state',
              label: 'Статус',
              type: 'select',
              required: true,
              defaultValue: 'available',
              options: [
                { label: 'Свободен', value: 'available' },
                { label: 'В брони', value: 'reserved' },
                { label: 'Продан', value: 'sold' },
                { label: 'Скрыт', value: 'hidden' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'photo',
          label: 'Фото щенка',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'notes',
          label: 'Заметка под карточкой',
          type: 'text',
          admin: {
            description: 'Короткая характеристика щенка. Опционально.',
          },
        },
      ],
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (user) return true;
      return {
        and: [{ _status: { equals: 'published' } }, { status: { not_equals: 'hidden' } }],
      };
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  endpoints: [
    {
      path: '/:id/create-page',
      method: 'post',
      handler: async (req) => {
        const { payload, routeParams } = req;
        const id = routeParams?.id as string | number | undefined;
        if (!id) {
          return Response.json({ error: 'litter id required' }, { status: 400 });
        }

        const litter = await payload.findByID({ collection: 'litters', id, depth: 0 });
        if (!litter) {
          return Response.json({ error: 'litter not found' }, { status: 404 });
        }

        // URL детальной — `/puppies/<dob ISO>/<letter>`. Pages.slug кастомной
        // = `puppies/<dob>/<letter>`. Без кастомной маршрут отдаёт generic
        // прямо из Litter (см. catchall в client).
        const dobIso = (litter.dob as string).slice(0, 10); // YYYY-MM-DD
        const pageSlug = `puppies/${dobIso}/${litter.letter}`;

        const existing = await payload.find({
          collection: 'pages',
          where: { slug: { equals: pageSlug } },
          limit: 1,
          depth: 0,
        });
        if (existing.docs[0]) {
          return Response.json({ pageId: existing.docs[0].id, created: false });
        }

        const created = await payload.create({
          collection: 'pages',
          data: {
            title: litter.title,
            slug: pageSlug,
            blocks: [
              { blockType: 'litter-header', litter: litter.id },
              { blockType: 'litter-pair-card', litter: litter.id },
              { blockType: 'litter-puppies', litter: litter.id, showSold: false },
            ],
            _status: 'published',
          } as never,
        });

        return Response.json({ pageId: created.id, created: true });
      },
    },
  ],
};
