import type { Access, FieldAccess } from 'payload';

/**
 * Кто правит сайт: редактор, вошедший через коллекцию `users`.
 *
 * @remarks
 * Раньше коллекции движка пускали на запись любого вошедшего -
 * `Boolean(user)`. Пока учётные записи были только у редакторов, это одно
 * и то же. Сайт, заведший вторую коллекцию с входом (покупатели магазина),
 * получил бы покупателя, который правит страницы своим токеном.
 *
 * Поэтому «вошёл» и «редактор» различаются явно: редактор - тот, кто вошёл
 * именно через `users`. Администратор - редактор с ролью `admin`; роль чужой
 * коллекции, даже если поле так же называется, ничего не даёт.
 */
export const EDITOR_COLLECTION = 'users';

type MaybeUser = { collection?: string; role?: unknown } | null | undefined;

export function isEditor<T>(user: T): user is NonNullable<T> {
  return Boolean(user) && (user as MaybeUser)?.collection === EDITOR_COLLECTION;
}

export function isAdmin(user: unknown): boolean {
  return isEditor(user) && (user as MaybeUser)?.role === 'admin';
}

/** Доступ «только редакторам» для коллекций и глобалов движка. */
export const editorsOnly: Access = ({ req: { user } }) => isEditor(user);

/** Доступ «только администраторам». */
export const adminsOnly: Access = ({ req: { user } }) => isAdmin(user);

/** То же для поля: у Payload доступ к полю - отдельный тип. */
export const adminsOnlyField: FieldAccess = ({ req: { user } }) => isAdmin(user);

/**
 * Никому через API: запись меняют только сценарии модуля, локально и в обход
 * доступа. Так поле или коллекция не правятся в обход их правил - например,
 * статус заказа мимо таблицы переходов.
 */
export const nobody: Access = () => false;
export const nobodyField: FieldAccess = () => false;
