import type { Payload } from 'payload';

import type { GrantedItem } from './entitlement-source';

/**
 * Адрес подборки или записи — канал и короткий код.
 *
 * @remarks
 * Погашение ссылки знает про право и ничего не знает про то, куда потом вести
 * человека: право живёт номерами, а страница адресуется каналом автора и коротким
 * кодом. Поиск адреса вынесен сюда отдельно, чтобы приём ссылки не оброс третьим
 * делом — он находит, гасит и записывает право, и этого ему достаточно.
 *
 * Возвращает `null`, когда адреса нет: запись без автора или без короткого кода
 * бывает у только что залитого, и вести на несуществующую страницу хуже, чем
 * остаться на месте с объяснением.
 */

export interface ResourceAddress {
  /** Канал автора — первая часть адреса. */
  readonly channel: string;
  /** Короткий код записи или подборки. */
  readonly code: string;
}

/** Владелец в том виде, в каком связь приходит с одной ступенью вложенности. */
type Owner = { channel?: string | null } | string | number | null | undefined;

/**
 * Запись и подборка называют владельца по-разному.
 *
 * @remarks
 * У подборки это `author`, у записи — `uploadedBy`. Разница историческая
 * и наружу не видна: канал в адресе один и тот же.
 */
interface Addressable {
  readonly shortCode?: string | null;
  readonly author?: Owner;
  readonly uploadedBy?: Owner;
}

const channelOf = (owner: Owner): string | null =>
  typeof owner === 'object' && owner ? (owner.channel ?? null) : null;

export async function resourceAddress(
  payload: Payload,
  resource: GrantedItem,
): Promise<ResourceAddress | null> {
  const doc = (await payload
    .findByID({
      collection: resource.kind,
      id: resource.id,
      // Канал лежит у автора, поэтому нужна одна ступень вложенности.
      depth: 1,
      overrideAccess: true,
    })
    .catch(() => null)) as Addressable | null;

  const code = doc?.shortCode;
  if (!code) return null;

  const channel = channelOf(doc?.author) ?? channelOf(doc?.uploadedBy);
  if (!channel) return null;

  return { channel, code };
}
