'use client';

import { TextInput, useField } from '@payloadcms/ui';
import type { NumberFieldClientComponent } from 'payload';
import { useEffect, useState } from 'react';

import { type Currency, formatMoney, microsToUnits, toMoney, unitsToMicros } from 'contracts';

/**
 * Сумма в админке: человек видит и вводит рубли, в поле лежат целые микроединицы.
 *
 * @remarks
 * Деньги хранятся одним целым (docs/adr/002-money.md), а владелец думает в
 * рублях с копейками. Перевод - здесь и только здесь: сценарии и база дробей
 * не видят. Пустое поле остаётся пустым - у позиции это «цена по запросу».
 * Поле штатное (`TextInput`), чтобы стоять в ряду с соседями как своё.
 *
 * Валюта приходит свойством `currency` из настройки поля; по умолчанию рубль.
 */
const asText = (micros: number): string => {
  const units = microsToUnits(micros);
  return (Number.isInteger(units) ? String(units) : units.toFixed(2)).replace('.', ',');
};

const MoneyField: NumberFieldClientComponent = (props) => {
  const { field, path, readOnly } = props;
  const currency = ((props as { currency?: Currency }).currency ?? 'RUB') as Currency;
  const fieldPath = path ?? field.name;
  const { value, setValue, showError, disabled } = useField<number | null>({ path: fieldPath });
  const shown = typeof value === 'number' ? asText(value) : '';
  const [text, setText] = useState(shown);

  // Значение пришло извне (загрузка записи, пересчёт сервером) - показываем его.
  useEffect(() => {
    setText(shown);
  }, [shown]);

  const commit = (raw: string) => {
    setText(raw);
    const trimmed = raw.replace(/\s/g, '').replace(',', '.');
    if (!trimmed) return setValue(null);
    const units = Number(trimmed);
    if (Number.isFinite(units) && units >= 0) setValue(unitsToMicros(units));
  };

  const symbol = formatMoney(toMoney(0, currency)).replace(/[\d\s,.]/g, '');
  const locked = Boolean(readOnly || field.admin?.readOnly || disabled);
  const label = typeof field.label === 'string' ? `${field.label}, ${symbol}` : field.label;

  return (
    <TextInput
      path={fieldPath}
      {...(label === undefined ? {} : { label })}
      {...(field.required === undefined ? {} : { required: field.required })}
      {...(field.admin?.description === undefined ? {} : { description: field.admin.description })}
      readOnly={locked}
      showError={showError}
      value={locked && typeof value === 'number' ? formatMoney(toMoney(value, currency)) : text}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => commit(e.target.value)}
      placeholder="0"
    />
  );
};

export default MoneyField;
