/**
 * Пришёл ли запрос из админки: открыта её страница или с неё отправлена форма.
 *
 * @remarks
 * Не проверка прав, а различение места: права Payload для кнопок админки считает
 * по запросу её страницы, а форма админки шлёт запрос со своей страницы. Так
 * действие можно убрать из админки, не закрывая его сайту, у которого тот же домен
 * и та же кука вошедшего редактора.
 */
export function fromAdmin(req: {
  readonly url?: string | null;
  readonly headers: { get(name: string): string | null };
  readonly payload: { readonly config: { readonly routes: { readonly admin: string } } };
}): boolean {
  const admin = req.payload.config.routes.admin || '/admin';
  const under = (address: string | null | undefined) => {
    if (!address) return false;
    let path: string;
    try {
      path = new URL(address, 'http://local').pathname;
    } catch {
      return false;
    }
    return path === admin || path.startsWith(`${admin}/`);
  };
  return under(req.url) || under(req.headers.get('referer'));
}
