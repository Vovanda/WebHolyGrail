import { headers } from 'next/headers';

import { CMS_URL } from './cms-url';

/** Кука, которой CMS помечает вошедшего в админку. */
const TOKEN = 'payload-token';

/**
 * Пропуск редактора из заголовка `cookie`; пусто - смотрящий не вошёл.
 *
 * @remarks
 * Передаётся один пропуск, а не все куки смотрящего: остальное относится
 * к сайту, и в CMS ему делать нечего.
 */
export function editorPassFrom(cookieHeader: string): string {
  return (
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${TOKEN}=`)) ?? ''
  );
}

/**
 * Заголовки запроса в CMS от имени редактора; пусто - смотрящий не вошёл.
 *
 * @remarks
 * Одного пропуска CMS мало: куку без `origin` она не принимает, считая запрос
 * подложным, и отвечает как анониму - без черновиков. Сервер сайта ходит
 * в CMS сам, `origin` браузер тут не подставит, поэтому его ставим мы -
 * адрес самой CMS.
 */
export function editorHeaders(pass: string): Record<string, string> {
  return pass ? { cookie: pass, origin: CMS_URL } : {};
}

/**
 * Признак редактора: вошёл ли смотрящий в админку.
 *
 * @remarks
 * Нужен предпросмотру рядом с формой: в панели открыта та же страница сайта,
 * и показать в ней надо правку, а не последнюю опубликованную версию. Право
 * на черновик проверяет сама CMS - сюда передаётся только пропуск.
 */
export async function editorPass(): Promise<string> {
  return editorPassFrom((await headers()).get('cookie') ?? '');
}
