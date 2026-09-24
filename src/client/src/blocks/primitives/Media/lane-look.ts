/**
 * Вид ленты: полотно, стёклышки кнопок, зоны листания.
 *
 * @remarks
 * Лент на сайте две. Одна собирается сама из всех кадров страницы, вторая
 * открывает свою группу - снимки одной карусели или одной карточки. Показ
 * у них обязан быть один: владелец видит один сайт, и вторая повадка читается
 * как недоделка.
 *
 * Поэтому вид живёт здесь, а не в компоненте: каждая лента берёт его готовым
 * и добавляет только своё - что показывать и как отзываться на листание.
 */

import type { LightboxExternalProps } from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

/**
 * Сколько длится ход приближения.
 *
 * @remarks
 * Одно значение на кадр и на кнопки: кадр растёт, кнопки отъезжают к краям,
 * и при разном ходе кнопки успевают доехать раньше, дёргая глаз.
 */
export const MOVE_MS = 400;

export const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/** Отступ кнопок сверху и справа от края кадра. */
const GUTTER = 'var(--lane-frame-right, 0px)';

/**
 * Насколько счётчик и кнопки опущены от верхнего края.
 *
 * @remarks
 * По верхней границе кадра их ставить нельзя: кадры разной высоты, и при
 * листании кнопки прыгали бы вверх-вниз. Поэтому они стоят на месте, но
 * не впритык к краю экрана.
 */
const TOP_ROOM = '0.75rem';

/**
 * Насколько зона листания заходит на кадр.
 *
 * @remarks
 * Нажимают в сторону экрана, а не в значок: зона занимает всю высоту и всё
 * поле сбоку от кадра, заходя немного на его край. Клик в пустоту рядом
 * со снимком тоже листает.
 */
const OVERLAP = 56;

/**
 * Вид кнопок ленты.
 *
 * @remarks
 * Кнопка стоит на картинке, а не на пустом фоне: на телефоне полей по бокам
 * нет вовсе, да и на мониторе широкий кадр доходит до самых краёв. Белый значок
 * без подложки на светлом снимке пропадает, поэтому под ним тёмный кружок -
 * он же даёт кнопке поле для нажатия пальцем.
 *
 * Размер и фон задаются переменными самой ленты: иначе листание и закрытие
 * получают вид из разных мест и выглядят кнопками из двух наборов.
 */
export const BUTTON_LOOK = {
  '--yarl__icon_size': '32px',
  '--yarl__button_background_color': 'transparent',
  '--yarl__button_padding': '10px',
  '--yarl__navigation_button_padding': '10px',
  '--yarl__button_margin': '12px',
  /*
    Своя тень кнопки снята. Лента вешает её через filter, а filter у предка
    обнуляет размытие подложки у всего, что внутри: стекло под значком
    переставало размывать кадр и оставалось одной плёнкой. Тень теперь
    даёт само стекло.
  */
  '--yarl__button_filter': 'none',
} as const;

/**
 * Вид кнопки: форма и ход, без своей подложки.
 *
 * @remarks
 * Этот набор достаётся всем кнопкам ленты, а зоны листания - тоже кнопки,
 * и каждая занимает половину экрана. Размытие отсюда размывало снимок целиком,
 * поэтому оно живёт у значка: там оно и нужно - кружком под стрелкой.
 */
export const ROUND = {
  borderRadius: '9999px',
  transition: `left ${MOVE_MS}ms ${EASING}, right ${MOVE_MS}ms ${EASING}`,
} as const;

/**
 * Стёклышко под значком.
 *
 * @remarks
 * Тёмная заливка спорит со снимком, поэтому под значком не она, а размытый
 * кружок с тонкой границей и мелкой тенью: он отделяет значок от любого фона
 * и кадра не закрывает. Границу видно на светлом снимке, тень - на тёмном,
 * поэтому нужны обе.
 *
 * Один набор на все кнопки ленты и на кнопку файла: иначе
 * листание, закрытие и приближение выглядят кнопками из разных наборов.
 */
export const HALO = {
  borderRadius: '9999px',
  // Матовое стекло: сильное размытие плюс белёсая плёнка поверх. Одно
  // размытие даёт прозрачную линзу, в которой кадр всё ещё читается,
  // и значок на ней теряется.
  backdropFilter: 'blur(8px) saturate(1.2)',
  background: 'var(--color-lane-glass)',
  border: '2px solid var(--color-lane-glass-edge)',
  boxShadow: 'var(--shadow-lane-halo)',
} as const;

/** Зона листания: во всю высоту, прозрачная, значок по краю кадра. */
const LANE_ZONE = {
  top: 0,
  height: '100%',
  transform: 'none',
  display: 'flex',
  alignItems: 'center',
  background: 'transparent',
  borderRadius: 0,
  padding: 0,
} as const;

/**
 * Где стоит счётчик.
 *
 * @remarks
 * Сверху слева, напротив кнопок: верх держат две группы по краям, а низ
 * целиком отдан подписи.
 */
export const LANE_COUNTER = {
  container: {
    style: {
      zIndex: 2,
      top: TOP_ROOM,
      bottom: 'unset',
      paddingLeft: GUTTER,
      transition: `padding ${MOVE_MS}ms ${EASING}`,
    },
  },
} as const;

/**
 * Расстановка частей ленты по краям полотна.
 *
 * @remarks
 * Задаётся здесь, а не стилями сайта: стили пакета подключаются позже наших
 * и перебивают правила по классам. В таблице сайта остаётся только наведение.
 */
export const LANE_STYLES = {
  root: BUTTON_LOOK,
  button: ROUND,
  icon: {
    ...HALO,
    boxSizing: 'content-box' as const,
    padding: '10px',
  },
  navigationPrev: {
    ...LANE_ZONE,
    /*
      Зона листания лежит ниже кнопок: она занимает всю высоту и заходит
      на края кадра, поэтому в верхних углах накрывала бы счётчик, закрытие
      и приближение - нажатие по ним листало бы кадр.
    */
    zIndex: 1,
    left: 0,
    width: `calc(var(--lane-frame-left, 0px) + ${OVERLAP}px)`,
    justifyContent: 'flex-end',
    transition: `width ${MOVE_MS}ms ${EASING}`,
  },
  navigationNext: {
    ...LANE_ZONE,
    zIndex: 1,
    right: 0,
    width: `calc(var(--lane-frame-right, 0px) + ${OVERLAP}px)`,
    justifyContent: 'flex-start',
    transition: `width ${MOVE_MS}ms ${EASING}`,
  },
  toolbar: {
    /* Кнопки поверх зон листания: они мельче и должны ловить нажатие первыми. */
    zIndex: 2,
    paddingRight: GUTTER,
    gap: '0.5rem',
    transition: `padding ${MOVE_MS}ms ${EASING}`,
  },
} as const;

/**
 * Подписи органов ленты.
 *
 * @remarks
 * Их зачитывает экранный диктор и показывает подсказка под курсором. Плагин
 * по умолчанию говорит по-английски, сайт русский.
 */
export const LANE_LABELS = {
  Previous: 'Предыдущий кадр',
  Next: 'Следующий кадр',
  Close: 'Закрыть',
  Lightbox: 'Просмотр кадров',
  Carousel: 'Лента кадров',
  Slide: 'Кадр',
  'Photo gallery': 'Галерея',
  '{index} of {total}': '{index} из {total}',
  'Zoom in': 'Приблизить',
  'Zoom out': 'Отдалить',
  Download: 'Скачать',
  'Enter Fullscreen': 'Во весь экран',
  'Exit Fullscreen': 'Выйти из полноэкранного',
} as const;

/**
 * Общие настройки обеих лент.
 *
 * @remarks
 * Поля кадра задаёт полотно - стилями, по переменным ленты. Своё поле карусели
 * снято: два источника полей давали бы разные значения, и кадр вставал бы
 * не в ту рамку, по краям которой стоит обвязка.
 *
 * Приближения здесь нет: его предел зависит от кадра и окна, и ленты берут
 * его из `useLaneZoom`.
 */
export const LANE_PROPS = {
  className: 'lane',
  plugins: [Zoom, Counter],
  carousel: { padding: 0 },
  animation: { zoom: MOVE_MS },
  counter: LANE_COUNTER,
  labels: LANE_LABELS,
  styles: LANE_STYLES,
} satisfies Partial<LightboxExternalProps>;
