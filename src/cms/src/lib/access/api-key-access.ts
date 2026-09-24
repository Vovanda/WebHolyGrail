/**
 * Кто видит ключ API учётной записи.
 *
 * @remarks
 * Ключ действует от имени своей учётки: у кого ключ админа, тот и админ.
 * Список пользователей при этом читают все вошедшие - редактору нужно
 * выбрать автора. Поэтому ключ закрыт отдельно от записи: его видит
 * владелец и администратор, остальные получают запись без него, в том
 * числе там, где учётка раскрыта связью (автор загрузки у файла).
 */
export interface Viewer {
  readonly id: number | string;
  readonly role?: string | null | undefined;
}

export function canReadApiKey(
  viewer: Viewer | null | undefined,
  accountId: number | string | undefined,
): boolean {
  if (!viewer) return false;
  if (viewer.role === 'admin') return true;
  return accountId !== undefined && String(viewer.id) === String(accountId);
}
