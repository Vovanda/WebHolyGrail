import type { NumberField } from 'payload';

/**
 * Денежное поле: целые микроединицы в базе, рубли в форме и в списке.
 *
 * @remarks
 * Имя поля несёт единицу (`priceMicros`), чтобы шкалу не забыли там, где
 * значение читают сырым (docs/adr/002-money.md). Дробное значение база не
 * примет: проверка требует целое не меньше нуля.
 */
export function moneyField(
  name: `${string}Micros`,
  label: string,
  rest: Omit<Partial<NumberField>, 'name' | 'type' | 'label'> = {},
): NumberField {
  return {
    ...rest,
    name,
    label,
    type: 'number',
    min: 0,
    validate: (value: unknown) =>
      value === null ||
      value === undefined ||
      (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
      'Сумма - целое число микроединиц не меньше нуля',
    admin: {
      ...rest.admin,
      components: {
        Field: '/admin/components/MoneyField',
        Cell: '/admin/components/MoneyCell',
        ...rest.admin?.components,
      },
    },
  } as NumberField;
}
