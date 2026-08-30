import type { CollectionConfig } from 'payload';

import { PAGE_BLOCKS } from '../../blocks';

/**
 * Специалисты — люди, ради которых существует каталог: тренеры, мастера,
 * врачи, репетиторы. Одна запись — один человек и одна личная страница.
 *
 * @remarks
 * **Почему blocks прямо здесь, а не отдельной страницей.** Каждому нужна своя
 * подача — кому-то галерея, кому-то расписание, кому-то только текст. Блоки
 * внутри записи дают эту свободу и одновременно держат данные в одном
 * документе: права проверяются один раз, на карточке, и человек физически не
 * может отредактировать чужую страницу.
 *
 * **Изоляция.** `owner` связывает запись с учёткой. Владелец правит только
 * себя, админ — всех. Пока специалистов заводит администратор, поле можно не
 * заполнять; оно понадобится, когда появится самостоятельная регистрация.
 *
 * **Адрес страницы.** Берётся из псевдонима, если он есть, иначе из имени
 * транслитом: `Алексей Самбулов` → `aleksey-sambulov`.
 */
export const Specialists: CollectionConfig = {
  slug: 'specialists',
  custom: { slugFrom: ['nickname', 'fullName'] },
  labels: { singular: 'Специалист', plural: 'Специалисты' },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['fullName', 'city', 'acceptingClients', 'updatedAt'],
    group: 'Каталог',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    // Свой профиль правит владелец, чужой — только администратор.
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return { owner: { equals: user.id } };
    },
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Профиль',
          fields: [
            { name: 'fullName', label: 'Имя и фамилия', type: 'text', required: true },
            {
              name: 'nickname',
              label: 'Псевдоним',
              type: 'text',
              admin: {
                description:
                  'Если есть — станет адресом страницы вместо имени. Например «samurai» вместо «aleksey-sambulov».',
              },
            },
            { name: 'photo', label: 'Фотография', type: 'upload', relationTo: 'media' },
            {
              name: 'headline',
              label: 'Одной строкой',
              type: 'text',
              admin: { description: 'Чем занимается. Показывается в карточке каталога.' },
            },
            {
              name: 'city',
              label: 'Город',
              type: 'relationship',
              relationTo: 'cities',
              admin: { description: 'По нему специалист попадает в подборку своего города.' },
            },
            {
              name: 'disciplines',
              label: 'Направления',
              type: 'array',
              admin: { description: 'Что ведёт: силовые, пилатес, сайкл, растяжка.' },
              fields: [{ name: 'title', label: 'Название', type: 'text', required: true }],
            },
            {
              name: 'bio',
              label: 'О себе',
              type: 'textarea',
              admin: { description: 'Несколько абзацев от первого лица.' },
            },
            {
              name: 'credentials',
              label: 'Образование и регалии',
              type: 'array',
              fields: [
                { name: 'title', label: 'Что', type: 'text', required: true },
                { name: 'note', label: 'Подробность', type: 'text' },
              ],
            },
            {
              name: 'facts',
              label: 'Факты о себе',
              type: 'array',
              admin: {
                description: 'Короткие живые детали — они цепляют сильнее списка дипломов.',
              },
              fields: [{ name: 'text', label: 'Факт', type: 'text', required: true }],
            },
          ],
        },
        {
          label: 'Связь',
          fields: [
            {
              name: 'acceptingClients',
              label: 'Принимает новых клиентов',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Снимите галочку — специалист останется на сайте, но пропадёт из подборок «свободны сейчас».',
              },
            },
            {
              name: 'contacts',
              label: 'Контакты',
              type: 'group',
              admin: {
                description:
                  'Как с человеком связаться. Ссылку на личный сайт не спрашиваем: каталог не уводит клиента на сторону.',
              },
              fields: [
                { name: 'phone', label: 'Телефон', type: 'text' },
                { name: 'email', label: 'Почта', type: 'text' },
                { name: 'telegram', label: 'Telegram', type: 'text' },
                { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
                { name: 'vk', label: 'ВКонтакте', type: 'text' },
                { name: 'youtube', label: 'YouTube', type: 'text' },
              ],
            },
            {
              name: 'locations',
              label: 'Где найти',
              type: 'array',
              admin: {
                description: 'Залы, студии, площадки. Можно несколько адресов в разных районах.',
              },
              fields: [
                { name: 'title', label: 'Название места', type: 'text', required: true },
                { name: 'address', label: 'Адрес', type: 'text' },
                { name: 'note', label: 'Уточнение', type: 'text' },
                { name: 'mapUrl', label: 'Ссылка на карту', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Личная страница',
          fields: [
            {
              name: 'blocks',
              label: 'Блоки страницы',
              type: 'blocks',
              blocks: PAGE_BLOCKS,
              admin: {
                description:
                  'Собирается как обычная страница. Если оставить пустым, страница покажет профиль: фото, био, направления, контакты.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'seo',
              label: 'SEO',
              type: 'group',
              admin: {
                description:
                  'Не заполнено — берётся из профиля: имя в заголовок, специализация в описание, фото в картинку ссылки.',
              },
              fields: [
                { name: 'title', label: 'Title (переопределить)', type: 'text' },
                { name: 'description', label: 'Description', type: 'textarea' },
                {
                  name: 'ogImage',
                  label: 'Картинка для соцсетей',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Что увидят в превью ссылки при отправке в мессенджер.',
                  },
                },
                {
                  name: 'noindex',
                  label: 'Скрыть от поисковиков (noindex, nofollow)',
                  type: 'checkbox',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      label: 'Адрес страницы',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Заполнится сам. После публикации менять не стоит — сломает ссылки.',
      },
    },
    {
      name: 'owner',
      label: 'Учётная запись',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        description: 'Кто может править этот профиль сам. Пусто — правит только администратор.',
      },
    },
    /**
     * Ранжирование. Место в подборках складывается из оценки, ручной надбавки и
     * накопленных заявок. Величины держим раздельно: видно, за счёт чего человек
     * поднялся, и одну можно обнулить, не тронув остальные.
     */
    {
      name: 'rating',
      label: 'Оценка',
      type: 'number',
      min: 0,
      max: 5,
      admin: {
        position: 'sidebar',
        step: 0.1,
        description: 'От 0 до 5. Видна только внутри, пока не включена галочка ниже.',
      },
    },
    {
      name: 'ratingPublic',
      label: 'Показывать оценку на сайте',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'boost',
      label: 'Ручная надбавка',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description:
          'Поднимает в списках вручную — для новых, кого ещё некому оценить, и для тех, кого нужно показать выше.',
      },
    },
    {
      name: 'requestsCount',
      label: 'Заявок получено',
      type: 'number',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Считается по заявкам с сайта и влияет на место в подборках.',
      },
    },
  ],
};
