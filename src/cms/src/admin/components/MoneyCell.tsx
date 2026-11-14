'use client';

import type { DefaultCellComponentProps } from 'payload';

import { type Currency, formatMoney, toMoney } from 'contracts';

/** Сумма в списке записей: «4 500,50 ₽» вместо микроединиц. Не ставится первой колонкой. */
export default function MoneyCell(props: DefaultCellComponentProps & { currency?: Currency }) {
  const { cellData } = props;
  if (typeof cellData !== 'number' || !Number.isSafeInteger(cellData) || cellData < 0) return null;
  return <span>{formatMoney(toMoney(cellData, props.currency ?? 'RUB'))}</span>;
}
