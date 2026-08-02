import type { Block } from 'payload';

/**
 * Форма заявки — единая на все случаи: записаться к специалисту, попасть в
 * каталог, задать вопрос.
 *
 * @remarks
 * Полей намеренно четыре: имя, город, способ связи и сообщение. Каждое лишнее
 * поле в форме на сайте стоит части заявок, а всё остальное всё равно
 * выясняется в первом же разговоре.
 *
 * Заявки падают в «Заявки с сайта» и различаются полем «тип» — по нему видно,
 * человек записывается или просится в каталог.
 */
export const RequestFormBlock: Block = {
  slug: 'request-form',
  labels: { singular: 'Форма заявки', plural: 'Формы заявки' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок',
      type: 'text',
      required: true,
      defaultValue: 'Оставить заявку',
    },
    {
      name: 'description',
      label: 'Пояснение',
      type: 'textarea',
      admin: { description: 'Чего ждать после отправки: когда и как ответят.' },
    },
    {
      name: 'requestType',
      label: 'Тип заявки',
      type: 'text',
      required: true,
      defaultValue: 'general',
      admin: {
        description:
          'Метка, по которой заявки этой формы отличаются в списке. Например «signup» для анкеты специалиста, «booking» для записи.',
      },
    },
    {
      name: 'specialist',
      label: 'Заявка адресована специалисту',
      type: 'relationship',
      relationTo: 'specialists',
      admin: {
        description:
          'Для формы на личной странице. Такая заявка засчитывается специалисту и поднимает его в подборках.',
      },
    },
    {
      name: 'anchor',
      label: 'Якорь секции',
      type: 'text',
      admin: {
        description:
          'Чтобы на форму вели кнопки со страницы: укажите слово без пробелов, например join, и ссылайтесь как «#join». Пусто — якорь соберётся из типа заявки.',
      },
    },
    {
      name: 'collapsible',
      label: 'Скрывать форму до клика',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Форма свернётся в одну строку и раскроется по клику. Удобно, когда она нужна не всем посетителям.',
      },
    },
    {
      name: 'toggleLabel',
      label: 'Надпись на свёрнутой строке',
      type: 'text',
      defaultValue: 'Оставить заявку',
      admin: { condition: (_, siblingData) => Boolean(siblingData?.['collapsible']) },
    },
    {
      name: 'submitLabel',
      label: 'Надпись на кнопке',
      type: 'text',
      defaultValue: 'Отправить',
    },
    {
      name: 'successText',
      label: 'Ответ после отправки',
      type: 'text',
      defaultValue: 'Заявка отправлена. Свяжемся с вами в ближайшее время.',
    },
    {
      name: 'askCity',
      label: 'Спрашивать город',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'messageLabel',
      label: 'Подпись поля сообщения',
      type: 'text',
      defaultValue: 'Сообщение',
      admin: {
        description: 'Например «Что хотите тренировать» или «Расскажите о себе и опыте».',
      },
    },
  ],
};
