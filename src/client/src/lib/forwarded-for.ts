import { isIP } from 'node:net';

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

/**
 * Адрес посетителя на стороне сайта: последний в X-Forwarded-For.
 *
 * @remarks
 * Последний дописывает nginx, всё левее присылает сам клиент. Строка
 * проверяется на форму IP: её вставляют в адрес запроса к внешнему сервису,
 * и присланное «1.1.1.1/../x» туда попасть не должно.
 */
export function visitorIp(request: Request): string | null {
  const last = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim();
  const ip = last || request.headers.get('x-real-ip')?.trim();
  return ip && isIP(ip) !== 0 ? ip : null;
}
