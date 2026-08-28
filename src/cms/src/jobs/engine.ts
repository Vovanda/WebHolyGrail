import { BuildHlsTask } from './build-hls.task';
import { PurgeVideosTask } from './purge-videos.task';

/**
 * Задания движка - фоновая работа, общая для любого сайта на этом шаблоне.
 *
 * @remarks
 * Набор ездит обновлением целиком. Сборка сайта берёт его и дописывает свои:
 *
 * ```ts
 * jobs: { tasks: [...engineTasks, MyTask], ... }
 * ```
 *
 * Иначе выходит разъезд: файл задания приезжает обновлением, а в сборке сайта
 * его нет - и проверка типов падает на имени задачи, которого «не существует».
 */
export const engineTasks = [BuildHlsTask, PurgeVideosTask];
