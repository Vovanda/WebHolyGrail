import { blockPartsEndpoint } from './block-parts';
import { togglesEndpoint } from './toggles';
import {
  videoAccessEndpoint,
  videoByCodeEndpoint,
  videoChannelEndpoint,
  videoKeyEndpoint,
  videoManifestEndpoint,
  videoPlaylistByIdEndpoint,
  videoPlaylistEndpoint,
  videoRedeemEndpoint,
  videoRedeemLinkEndpoint,
  videoTokenEndpoint,
} from './video';

/**
 * Ручки движка - всё, что есть у любого сайта на этом шаблоне.
 *
 * @remarks
 * Набор ездит обновлением целиком, как коллекции и задания. Сборка сайта берёт
 * его и дописывает свои:
 *
 * ```ts
 * endpoints: [...engineEndpoints, myEndpoint],
 * ```
 *
 * Без общей точки сборки сайт теряет весь контур молча: файлы ручек приезжают
 * обновлением, а в конфиге их никто не перечисляет - и запись видео нарезана,
 * но манифест отвечает «маршрут не найден». Так и вышло на живом сайте: ни одна
 * ручка движка не была подключена, и обложка играла файл целиком мимо нарезки.
 */
export const engineEndpoints = [
  blockPartsEndpoint,
  togglesEndpoint,
  videoTokenEndpoint,
  videoRedeemEndpoint,
  videoRedeemLinkEndpoint,
  videoByCodeEndpoint,
  videoChannelEndpoint,
  videoPlaylistEndpoint,
  videoPlaylistByIdEndpoint,
  videoAccessEndpoint,
  videoKeyEndpoint,
  videoManifestEndpoint,
];
