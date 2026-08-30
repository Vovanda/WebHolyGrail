/**
 * Куда вести зрителя после принятого приглашения.
 *
 * @remarks
 * Адрес человеческий - `/@канал`, такой же, как в хлебных крошках и ссылках
 * блоков. Служебный `/channel/...` работает тоже: внешний адрес переписывается
 * в него на входе. Но именно он остаётся в строке браузера, уезжает в закладки
 * и в пересылку, а поисковик получает два адреса одной страницы.
 *
 * Вынесено из компонента: сборка адреса проверяется без браузера, а увидеть
 * ошибку иначе можно только пройдя по живому приглашению - которое к тому же
 * одноразовое.
 */

export interface InviteAddress {
  readonly channel: string;
  readonly code: string;
}

export interface InviteResource {
  readonly kind: 'playlists' | 'media';
}

/**
 * Адрес того, что открыло приглашение.
 *
 * @remarks
 * Пусто возвращается, когда адреса ещё нет: у только что залитой записи может
 * не быть короткого кода. Право при этом уже выдано, и звать зрителя некуда -
 * решает это вызывающий, обычно ведёт на главную.
 */
export function invitePath(
  resource: InviteResource | undefined,
  address: InviteAddress | null,
): string | null {
  if (!address?.channel || !address?.code) return null;

  const part = resource?.kind === 'media' ? 'v' : 'p';
  return `/@${address.channel}/${part}/${address.code}`;
}
