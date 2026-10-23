'use client';

import { useRowLabel } from '@payloadcms/ui';

import { formatMoney, toMoney } from 'contracts';

/**
 * Заголовок строки заказа или счёта: название, количество и сумма.
 *
 * @remarks
 * Штатный заголовок - «Строка 01», и чтобы понять, что в заказе, приходилось
 * раскрывать каждую строку. Деньги - целые микроединицы, как в ячейке списка.
 */
export function ShopLineRowLabel() {
  const { data, rowNumber } = useRowLabel<{
    title?: string | null;
    quantity?: number | null;
    sumMicros?: number | null;
  }>();
  const title = data?.title?.trim() || `Строка ${String((rowNumber ?? 0) + 1).padStart(2, '0')}`;
  const quantity = typeof data?.quantity === 'number' ? ` × ${data.quantity}` : '';
  const sum =
    typeof data?.sumMicros === 'number' && Number.isSafeInteger(data.sumMicros)
      ? ` - ${formatMoney(toMoney(data.sumMicros, 'RUB'))}`
      : '';
  return (
    <span>
      {title}
      {quantity}
      {sum}
    </span>
  );
}
