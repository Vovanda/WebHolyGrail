/**
 * На странице играет один плеер.
 *
 * @remarks
 * Запустив второе видео, зритель получал два звука разом: первый продолжал
 * играть. На витрине плееров трое, и наткнуться на это может каждый.
 *
 * Плееры не знают друг о друге поимённо: запуск ловится одним слушателем на
 * документе. События воспроизведения не всплывают, поэтому слушаем в фазе
 * перехвата - так виден запуск любого кадра или звука на странице, включая
 * те, что появились позже.
 *
 * Остановленный плеер помнит место: пауза его не сбрасывает, и зритель
 * продолжает с той же секунды.
 */

/** Минимум от элемента, который здесь нужен: узнать, играет ли, и остановить. */
export interface Playable {
  readonly paused: boolean;
  pause: () => void;
}

/**
 * Остановить всё, что играет, кроме запущенного.
 *
 * @param started - тот, кто только что заиграл; его не трогаем.
 * @param all - все проигрыватели страницы, включая начавший.
 * @returns сколько остановлено - по этому числу видно, что правило сработало.
 */
export function pauseOthers(started: Playable, all: Iterable<Playable>): number {
  let stopped = 0;
  for (const one of all) {
    if (one === started || one.paused) continue;
    one.pause();
    stopped += 1;
  }
  return stopped;
}

/**
 * Следить за страницей: запуск любого проигрывателя останавливает остальные.
 *
 * @returns снятие слежения.
 */
export function watchSoloPlayback(root: Document = document): () => void {
  function onPlay(event: Event) {
    const started = event.target;
    if (!(started instanceof HTMLMediaElement)) return;
    pauseOthers(started, root.querySelectorAll<HTMLMediaElement>('video, audio'));
  }

  // Перехват, а не всплытие: события воспроизведения не всплывают вовсе.
  root.addEventListener('play', onPlay, true);
  return () => root.removeEventListener('play', onPlay, true);
}
