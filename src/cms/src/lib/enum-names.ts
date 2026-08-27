import type { Field } from 'payload';

/**
 * Короткие имена служебным типам-перечислениям.
 *
 * @remarks
 * Каждое поле-выбор Payload сопровождает типом-перечислением. В Postgres такой
 * тип живёт в базе наравне с таблицами, поэтому имя ему дают уникальное - через
 * всю цепочку вложенности: страница, поле блоков, сам блок, поле. У блоков
 * с длинными названиями цепочка переваливает за предел в 63 знака, и схема
 * не собирается вовсе. В SQLite подобных типов нет - там обычная текстовая
 * колонка, - но проверку длины Payload делает для обоих движков.
 *
 * Чтобы не подпирать это руками при каждом новом поле, набор полей несёт свой
 * короткий префикс, а имена проставляются здесь. Короткое имя получает только
 * невидимый тип: колонка в базе и поле в админке остаются полными.
 *
 * Одинаковое имя у разных блоков - не беда, а смысл: набор один и тот же,
 * значит и тип у него один.
 *
 * @example
 * export const APPEARANCE_FIELDS = withShortEnums('ap', [ ... ]);
 */
export function withShortEnums(prefix: string, fields: Field[]): Field[] {
  return fields.map((field) => name(prefix, field));
}

function name(prefix: string, field: Field): Field {
  // Ряды и вкладки полей не хранятся сами по себе - спускаемся внутрь.
  if ('fields' in field && Array.isArray(field.fields)) {
    return { ...field, fields: field.fields.map((inner) => name(prefix, inner)) } as Field;
  }

  if (field.type !== 'select' || !('name' in field)) return field;
  if ('enumName' in field && field.enumName) return field;

  return { ...field, enumName: `${prefix}_${field.name}` };
}
