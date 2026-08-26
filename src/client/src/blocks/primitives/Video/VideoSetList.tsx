import type { VideoSetItem } from 'contracts';

import { CarouselDeck, CarouselItem } from '@/blocks/primitives/Carousel';
import { ScrollList } from '@/blocks/primitives/ScrollList';

import { VideoSetCard } from './VideoSetCard';

/**
 * Список роликов набора.
 *
 * @remarks
 * Один компонент на три места: справа от плеера, под роликом на его странице
 * и отдельным блоком, где плеера нет вовсе. Отличаются они только тем, как
 * список повёрнут, поэтому разводить три похожих списка незачем (R9).
 *
 * Чистая функция от пропсов (R5): ничего не грузит и не знает, где стоит.
 * Замок и готовность приходят посчитанными — считать их здесь означало бы
 * делать это в браузере, где зрителю верить нельзя.
 */
export interface VideoSetListProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  /** Адрес канала: из него собираются ссылки на ролики. */
  readonly channel: string | null;
  /**
   * Как повёрнут список.
   *
   * @remarks
   * `vertical` — колонкой: рядом с плеером и когда роликов много.
   * `horizontal` — лентой: под плеером, где вертикаль отняла бы всю высоту.
   */
  readonly orientation?: 'vertical' | 'horizontal';
  /**
   * Потолок высоты колонки.
   *
   * @remarks
   * Рядом с плеером список равняется по нему, в панели занимает её целиком.
   * Без значения растёт по содержимому.
   */
  readonly maxHeight?: string | undefined;
  /** Сколько карточек показать сразу; остальные подгружаются при прокрутке. */
  readonly limit?: number | undefined;
  /** Отмеченный ролик — тот, что играет сейчас. */
  readonly currentCode?: string | null;
  /** Набор, из которого пришли: чтобы на странице ролика показать его же. */
  readonly setCode?: string | null;
  /** Нажатие вместо перехода — когда плеер рядом и уходить со страницы незачем. */
  readonly onSelect?: ((item: VideoSetItem) => void) | undefined;
  /**
   * Замки сейчас снимаются.
   *
   * @remarks
   * Между вводом кода и открытием держим замки на месте, но проигрываем на них
   * анимацию: если убрать иконку сразу, на экране просто что-то мигнёт, и
   * человек не поймёт, сработал код или нет.
   */
  readonly unlocking?: boolean;
  readonly className?: string;
}

export function VideoSetList({
  items,
  channel,
  orientation = 'vertical',
  maxHeight,
  limit,
  currentCode = null,
  setCode = null,
  onSelect,
  unlocking = false,
  className,
}: VideoSetListProps) {
  if (items.length === 0) {
    return <p className="text-body text-muted">В наборе пока нет видео.</p>;
  }

  // Какое видео сейчас играет: и лента, и колонка подъезжают к нему сами.
  const active = items.findIndex((item) => item.code === currentCode);
  const activeIndex = active >= 0 ? active : undefined;

  const rows = items.map((item, index) => (
    <VideoSetCard
      key={item.code}
      item={item}
      index={index + 1}
      channel={channel}
      orientation={orientation}
      current={item.code === currentCode}
      setCode={setCode}
      onSelect={onSelect}
      unlocking={unlocking}
    />
  ));

  /*
    Лентой набор листается пальцем и стрелками - той же каруселью, что и
    остальные ленты сайта. Своей прокрутки здесь нет: инерция, прилипание и
    поведение на телефоне уже собраны в примитиве.
  */
  if (orientation === 'horizontal') {
    return (
      <CarouselDeck mode="row" gap="md" arrows label="Видео набора" className={className}>
        {rows.map((row) => (
          <CarouselItem key={row.key} width="min(16rem, 78vw)">
            {row}
          </CarouselItem>
        ))}
      </CarouselDeck>
    );
  }

  /*
    Колонкой набор показывается списком: у него своя прокрутка с потолком по
    высоте и порции. Длинная серия иначе утаскивает вниз всю страницу, а сотня
    карточек разом заметно дольше рисуется.

    Память места привязана к самому набору: вернувшись, зритель видит список
    там же, где оставил.
  */
  return (
    <ScrollList
      maxHeight={maxHeight}
      limit={limit}
      more="scroll"
      activeIndex={activeIndex}
      rememberKey={setCode ? `set:${setCode}` : undefined}
      label="Видео набора"
      className={className}
    >
      {rows}
    </ScrollList>
  );
}
