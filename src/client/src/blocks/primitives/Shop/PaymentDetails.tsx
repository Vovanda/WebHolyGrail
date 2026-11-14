import type { ShopSettings } from 'contracts';

/**
 * PaymentDetails - куда платить по выставленному счёту.
 *
 * @remarks
 * Части: пояснение владельца «Как оплатить», реквизиты получателя, перевод по
 * СБП, номер карты. Показывается только заполненное: пустая строка «БИК: —»
 * покупателю ничего не даёт. Ничего не заполнено - компонента нет.
 * Данные - настройки магазина (`shopSettings`) и текст из настроек сайта.
 */
export function PaymentDetails({
  shop,
  note,
}: {
  readonly shop: ShopSettings;
  readonly note?: string | null | undefined;
}) {
  const payee = [
    ['Получатель', shop.payee.name],
    ['ИНН', shop.payee.inn],
    ['Расчётный счёт', shop.payee.account],
    ['Банк', shop.payee.bank],
    ['БИК', shop.payee.bik],
    ['Корр. счёт', shop.payee.corrAccount],
  ].filter(([, v]) => v);
  const sbp = shop.sbp.phone ? `${shop.sbp.phone}${shop.sbp.bank ? `, ${shop.sbp.bank}` : ''}` : '';
  if (!note && payee.length === 0 && !sbp && !shop.card) return null;

  return (
    <div data-part="payment" className="grid gap-3 rounded-md bg-accent-soft p-3 text-sm text-ink">
      {note && (
        <p data-part="payment-note" className="whitespace-pre-line">
          {note}
        </p>
      )}
      {payee.length > 0 && (
        <dl data-part="payment-payee" className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {payee.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="tabular-nums break-all">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {sbp && (
        <p data-part="payment-sbp">
          <span className="text-muted">По СБП: </span>
          <span className="tabular-nums">{sbp}</span>
        </p>
      )}
      {shop.card && (
        <p data-part="payment-card">
          <span className="text-muted">На карту: </span>
          <span className="tabular-nums">{shop.card}</span>
        </p>
      )}
    </div>
  );
}
