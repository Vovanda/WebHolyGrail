/**
 * Цепочка адресов клиента для запроса в CMS.
 *
 * @remarks
 * CMS считает попытки кода и запросы ключа по последнему адресу
 * X-Forwarded-For - его дописывает nginx. Запрос из прокси сайта в CMS идёт
 * внутри сети контейнеров и своего заголовка не несёт: без пересылки все
 * посетители сайта считались бы одним клиентом, и чужой перебор запирал бы
 * всех. Заголовок пересылается как получен, CMS сама берёт из него последний
 * адрес.
 */
export function forwardedFor(request: Request): Record<string, string> {
  const chain = request.headers.get('x-forwarded-for');
  return chain ? { 'x-forwarded-for': chain } : {};
}
