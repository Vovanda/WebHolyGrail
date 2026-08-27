import type { BlockNode } from './blocks';

/**
 * Layout Engine — slot-композиция в духе AVOX MainLayout.
 *
 * @remarks
 * Концепция: **everything is a Panel**. Header / Footer / Nav / Aside / Floating
 * widgets — это всё `PanelConfig` в одном из 6 фиксированных слотов. Сайт собирается
 * не выбором из готовых layout-классов, а **композицией панелей**.
 *
 * Один `<SiteLayout>` компонент рендерит любую конфигурацию. Когда придёт второй
 * клиент с другой раскладкой — меняется `SiteLayoutConfig`, страницы не трогаются.
 *
 * См. `docs/whg/30-philosophy.md` для дисциплины применения (R3, R4, R5).
 */

/**
 * Фиксированные 6 слотов. Этого хватает на 99% веб-кейсов
 * (сайт-визитка / SaaS-дашборд / магазин / админка / блог).
 */
export type SlotName =
  | 'top' // header / app-toolbar
  | 'bottom' // footer / mobile-tabbar / status-bar
  | 'left' // sidebar-nav / categories / TOC
  | 'right' // aside / cart / chat / context-help
  | 'center' // основной контент страницы (всегда есть)
  | 'overlay'; // fullscreen-nav / search-overlay / global-modal-host

/**
 * Mobile-стратегия для панели когда экран узкий.
 * Layout-движок при `isMobile` применяет эту стратегию вместо обычной раскладки.
 *
 * @remarks
 * Разница между `overlay` и `push` смысловая, а не оформительская. Overlay
 * накрывает страницу и говорит «вернись, когда закончишь» - так ведут себя
 * навигация и поиск. Push отодвигает страницу и говорит «это часть той же
 * работы» - так удобнее списку серии, оглавлению и фильтрам, где человек
 * переключается туда-обратно и хочет видеть, что страница никуда не делась.
 *
 * Push двигает весь каркас сайта вместе с шапкой. Двигать одну середину нельзя:
 * панель ляжет поверх шапки, и получится сдвинуто и перекрыто разом.
 *
 * Значения описывают только узкий экран. На широком боковая панель стоит в
 * раскладке и ужимает содержимое - это и есть push, когда места хватает,
 * поэтому отдельного «как на десктопе» в списке нет: на телефоне колонки рядом
 * с текстом всё равно не существует.
 */
export type PanelMobileStrategy =
  | 'push' // выезжает и отодвигает страницу целиком, оставаясь частью той же работы
  | 'overlay' // выезжает поверх контента по триггеру
  | 'drawer-bottom' // выезжает снизу (bottom-sheet)
  | 'hidden'; // вообще скрыта на узком экране

/**
 * Видимость панели на разных размерах экрана.
 */
export type PanelVisibility = 'always' | 'desktop' | 'mobile';

/**
 * Контент панели = либо описание блока (как контент страницы), либо ссылка на
 * страничный маршрут (для tool-UI / admin / IDE-paradigm).
 *
 * @remarks
 * **Дисциплина R11:** `PageRouteRef` в Panel используется ТОЛЬКО в tool-UI режимах
 * (admin / dashboard). Для публичной навигации сайта-визитки маршруты — обычные
 * страницы, не tabs-в-layout (иначе посетитель теряется).
 */
export type PanelContent = { kind: 'block'; node: BlockNode } | { kind: 'route'; path: string };

/**
 * Конфигурация одной панели в layout.
 *
 * @remarks
 * Панель = JSON-сериализуемая конфигурация (R5+). Никаких ReactNode / callbacks
 * в публичном контракте — конструктор будущего читает эту схему и автоматически
 * рисует редактор.
 */
export interface PanelConfig {
  /** Уникальный id панели (для React-key и панель-табов). */
  readonly id: string;
  /** В каком слое размещается. Если несколько панелей в одном слоте — рендерятся как табы. */
  readonly slot: SlotName;
  /** Что показать. */
  readonly content: PanelContent;

  /** Можно ли свернуть/развернуть. */
  readonly collapsible?: boolean;
  /** Можно ли менять размер (drag-handle между слотами). */
  readonly resizable?: boolean;
  /** Открыта ли при первом монтаже. */
  readonly defaultOpen?: boolean;
  /** Ширина (для left/right) или высота (для top/bottom). CSS-значение или число px. */
  readonly size?: string | number;

  /** На каких экранах вообще показывается. */
  readonly visibility?: PanelVisibility;
  /** Что делает на mobile когда экран узкий. */
  readonly mobile?: PanelMobileStrategy;

  /**
   * На каких адресах показывается. Пусто - на всех.
   *
   * @remarks
   * Раскладка одна на весь сайт, поэтому без этого поля любая панель попадает
   * на каждую страницу. Плейлист нужен там, где смотрят видео, фильтры - на
   * каталоге, оглавление - на статье.
   *
   * Маска простая: точное совпадение либо звёздочка на конце как «и всё, что
   * дальше». Ради этого поля не стоит тянуть разбор путей целиком - панелей
   * на сайте единицы, а читаемость конфига важнее гибкости.
   */
  readonly routes?: ReadonlyArray<string>;

  /** Метаданные для будущего конструктора (иконка таб-кнопки, человеческий title). */
  readonly meta?: {
    readonly title?: string;
    readonly icon?: string;
  };
}

/**
 * Полная конфигурация Layout сайта. Хранится в `SiteSettings.layout`.
 *
 * @remarks
 * При смене конфига меняется внешний вид всего сайта без правки страничных
 * компонентов. Это и есть R11 — Layout как сменный артефакт.
 */
export interface SiteLayoutConfig {
  /**
   * Массив всех панелей сайта. Минимум должен содержать одну панель в slot `center`
   * (без неё негде показать содержимое страниц).
   */
  readonly panels: readonly PanelConfig[];
  /**
   * Стратегия CSS-grid композиции слотов. На старте достаточно `classic-site`.
   * Когда понадобится нестандартная сетка — переключаем на `custom` и задаём grid вручную.
   */
  readonly grid?: {
    readonly template?: 'classic-site' | 'custom';
    /** Только для `template: 'custom'` — сырые CSS grid-template-rows. */
    readonly rows?: string;
    readonly columns?: string;
    readonly areas?: readonly string[];
  };
}
