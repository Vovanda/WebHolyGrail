import { getToggles } from './api-client';

/**
 * Какой слой управления рисует плеер.
 *
 * @remarks
 * Слоёв два: собранный своими руками и готовый от Vidstack. Пока непонятно,
 * какой останется, поэтому выбор вынесен в переключатель `video.layout.vendor` -
 * его видно в админке, он задаётся отдельно для пробного и рабочего сайта и
 * включается по времени.
 *
 * Раньше выбор жил полем в настройках сайта. Поле осталось на своём месте, но
 * значение больше не читается: два источника правды рано или поздно разойдутся,
 * и объяснить, почему сайт ведёт себя иначе, чем показывает админка, будет
 * нечем.
 *
 * Свод не ответил - рисуем готовый слой: он полнее, и привычное поведение
 * безопаснее внезапного.
 */
export type VideoUi = 'vidstack' | 'chrome';

/** Признак, которым переключают слой. */
export const VIDEO_UI_TOGGLE = 'video.layout.vendor';

/** Слой по своду переключателей. */
export function videoUiFrom(toggles: Record<string, boolean>): VideoUi {
  return toggles[VIDEO_UI_TOGGLE] === false ? 'chrome' : 'vidstack';
}

/** Слой, которым рисовать плеер на этой странице. */
export async function readVideoUi(): Promise<VideoUi> {
  return videoUiFrom(await getToggles());
}
