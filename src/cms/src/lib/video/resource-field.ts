/**
 * Разбор поля «на что открыт доступ».
 *
 * @remarks
 * Payload отдаёт связь по-разному: при поверхностном чтении в поле лежит номер,
 * при глубоком - целая запись. Тому, кто выдаёт право, нужен номер в обоих
 * случаях, иначе в право уедет объект вместо ссылки, и найти его потом
 * не выйдет ничем.
 *
 * Разбор жил в двух местах и по-разному: в приёме ссылки бережно, в выдаче
 * по коду приведением типа. Держалось это на том, что запись читалась
 * поверхностно; смена глубины ломала бы выдачу молча.
 */

/** На что выдано право: подборка целиком или отдельная запись. */
export interface AccessTarget {
  readonly kind: 'playlists' | 'media';
  readonly id: string | number;
}

/** Поле связи в том виде, в каком оно приходит из базы. */
export interface ResourceField {
  readonly relationTo?: string | undefined;
  readonly value?: unknown;
}

/**
 * Приводит поле связи к виду «что и какой номер».
 *
 * @remarks
 * Пусто возвращается на всё, что правом быть не может: чужой вид связи,
 * отсутствующий номер, пустая строка. Молча подставлять сюда что-то своё
 * нельзя - право откроет не то, за что заплачено.
 */
export function accessTarget(field: ResourceField | null | undefined): AccessTarget | null {
  const kind = field?.relationTo;
  if (kind !== 'playlists' && kind !== 'media') return null;

  const raw = field?.value;
  const id =
    typeof raw === 'object' && raw !== null && 'id' in raw ? (raw as { id?: unknown }).id : raw;

  if (typeof id === 'number' && Number.isFinite(id)) return { kind, id };
  if (typeof id === 'string' && id.trim() !== '') return { kind, id };
  return null;
}
