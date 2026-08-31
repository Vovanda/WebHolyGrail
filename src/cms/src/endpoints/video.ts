/**
 * Ручки видео. Дело каждой живёт в своём файле рядом.
 *
 * @remarks
 * Прежде здесь лежало всё разом - тысяча двести строк, десять ручек и общая
 * обвязка. Один файл менялся по десяти причинам сразу: правка выдачи ключа
 * соседствовала с разбором адреса канала, и найти нужное можно было только
 * поиском по имени (R11).
 *
 * Теперь по делам: каталог, подборки, манифест, доступ, ключ. Общее - ответы,
 * куки и идентичность зрителя - в `video/shared`.
 *
 * Этот путь остаётся: на него ссылается конфиг и сайты, собранные на прежнем
 * шаблоне (R10). Логика не менялась, только место.
 */
export { videoByCodeEndpoint, videoChannelEndpoint } from './video/catalog';
export { videoPlaylistEndpoint, videoPlaylistByIdEndpoint } from './video/playlists';
export { videoManifestEndpoint } from './video/manifest';
export {
  videoAccessEndpoint,
  videoRedeemEndpoint,
  videoTokenEndpoint,
  videoRedeemLinkEndpoint,
} from './video/access';
export { videoKeyEndpoint } from './video/key';
