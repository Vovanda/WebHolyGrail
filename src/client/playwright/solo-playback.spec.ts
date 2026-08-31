import { expect, test } from '@playwright/test';

/**
 * На странице играет один.
 *
 * @remarks
 * Проверяется на живой странице с плеером: слежение ставит сам плеер, и без
 * него останавливать соседей на странице некому.
 *
 * Два проигрывателя заводит сама проверка и кормит их потоком с холста -
 * настоящим, который браузер играет без сети и без звука. На витрине блок
 * с видео обычно один, а правило должно держаться для любой пары.
 *
 * Место просмотра здесь не проверяется: у живого потока позиции нет вовсе.
 * Его бережёт сама остановка - соседа только ставят на паузу, время ему
 * не трогают, и это видно проверками рядом с самим правилом.
 */

const DEMO_PATH = process.env.SMOKE_VIDEO_PATH ?? '/video';

test.describe('Один плеер на странице', () => {
  test('запуск второго останавливает первый', async ({ page }) => {
    const response = await page.goto(DEMO_PATH);
    if (response?.status() === 404) test.skip(true, 'демо-страницы на этом сайте нет');

    // Плеер собирается в браузере: пока его нет, слежения на странице тоже нет.
    const player = page.locator('media-player, video').first();
    try {
      await player.waitFor({ state: 'attached', timeout: 15_000 });
    } catch {
      test.skip(true, 'плеера на странице нет');
    }

    const result = await page.evaluate(async () => {
      /** Проигрыватель с потоком: холст рисует кадры, браузер их играет. */
      function make(): HTMLVideoElement {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const paint = canvas.getContext('2d');
        setInterval(() => {
          if (!paint) return;
          paint.fillStyle = `hsl(${Date.now() % 360} 80% 50%)`;
          paint.fillRect(0, 0, 32, 32);
        }, 40);

        const video = document.createElement('video');
        video.srcObject = canvas.captureStream(25);
        video.muted = true;
        video.playsInline = true;
        document.body.append(video);
        return video;
      }

      const first = make();
      const second = make();

      await first.play();
      const firstStarted = !first.paused;

      await second.play();
      // Слушатель на документе срабатывает синхронно с событием запуска,
      // но дадим кадру пройти - пауза применяется самим элементом.
      await new Promise((done) => setTimeout(done, 150));

      const answer = {
        firstStarted,
        firstPausedAfter: first.paused,
        secondPlaying: !second.paused,
      };

      first.remove();
      second.remove();
      return answer;
    });

    expect(result.firstStarted, 'первый должен был заиграть').toBe(true);
    expect(result.firstPausedAfter, 'запуск второго обязан остановить первый').toBe(true);
    expect(result.secondPlaying, 'второй продолжает играть').toBe(true);
  });
});
