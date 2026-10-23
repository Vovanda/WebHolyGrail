import { describe, expect, it } from 'vitest';

import {
  buildOrder,
  buyerStep,
  checkBuyer,
  cleanCart,
  depositLines,
  type InvoiceStatus,
  MAX_QUANTITY,
  type OfferSnapshot,
  paymentPrice,
  shopSettings,
  STALE_ORDER_HOURS,
} from './shop';

const offer = (o: Partial<OfferSnapshot> & { id: number }): OfferSnapshot => ({
  title: `Позиция ${o.id}`,
  price: 10_000,
  stock: null,
  howToBuy: 'cart',
  deposit: null,
  ...o,
});

describe('корзина из браузера', () => {
  it('склеивает повторы и выбрасывает мусор', () => {
    expect(
      cleanCart([
        { offer: 1, quantity: 2 },
        { offer: 1, quantity: 3 },
        { offer: 'x', quantity: 1 },
        { offer: 2, quantity: 0 },
        { offer: -3, quantity: 1 },
        { offer: 4, quantity: 2.7 },
      ]),
    ).toEqual([
      { offer: 1, quantity: 5 },
      { offer: 4, quantity: 2 },
    ]);
  });

  it('количество не больше предела', () => {
    expect(cleanCart([{ offer: 1, quantity: 1e9 }])).toEqual([
      { offer: 1, quantity: MAX_QUANTITY },
    ]);
  });
});

describe('сборка заказа', () => {
  it('цена из базы, сумма в копейках', () => {
    const r = buildOrder([{ offer: 1, quantity: 3 }], [offer({ id: 1, price: 12_550 })]);
    expect(r).toEqual({
      ok: true,
      total: 37_650,
      lines: [
        {
          offer: 1,
          title: 'Позиция 1',
          quantity: 3,
          price: 12_550,
          sum: 37_650,
          mode: 'cart',
          deposit: null,
        },
      ],
    });
  });

  it('позиция без цены и удалённая выпадают', () => {
    const r = buildOrder(
      [
        { offer: 1, quantity: 1 },
        { offer: 2, quantity: 1 },
        { offer: 3, quantity: 1 },
      ],
      [offer({ id: 1 }), offer({ id: 2, price: null })],
    );
    expect(r.ok && r.lines.map((l) => l.offer)).toEqual([1]);
  });

  it('нехватка остатка отклоняет заказ целиком', () => {
    const r = buildOrder(
      [
        { offer: 1, quantity: 1 },
        { offer: 2, quantity: 2 },
      ],
      [offer({ id: 1 }), offer({ id: 2, stock: 1 })],
    );
    expect(r).toEqual({ ok: false, empty: false, shortage: [{ offer: 2, available: 1 }] });
  });

  it('штучная позиция: второй заказ того же щенка не собирается', () => {
    expect(buildOrder([{ offer: 7, quantity: 1 }], [offer({ id: 7, stock: 1 })]).ok).toBe(true);
    expect(buildOrder([{ offer: 7, quantity: 1 }], [offer({ id: 7, stock: 0 })])).toEqual({
      ok: false,
      empty: false,
      shortage: [{ offer: 7, available: 0 }],
    });
  });

  it('пустая корзина - пустой заказ', () => {
    expect(buildOrder([], [])).toEqual({ ok: false, empty: true, shortage: [] });
  });
});

describe('анкета покупателя', () => {
  const good = {
    name: ' Анна ',
    phone: '+7 (900) 000-00-00',
    email: '',
    comment: '',
    consent: true,
  };

  it('годная анкета обрезается по краям', () => {
    expect(checkBuyer(good)).toEqual({
      ok: true,
      buyer: { name: 'Анна', phone: '+7 (900) 000-00-00', email: '', comment: '' },
    });
  });

  it('без способа связи и без согласия - ошибки по полям', () => {
    const r = checkBuyer({ name: 'Анна', consent: false });
    expect(r.ok).toBe(false);
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(['consent', 'contact']);
  });

  it('согласие только true, не строка', () => {
    expect(checkBuyer({ ...good, consent: 'true' }).ok).toBe(false);
  });

  it('неверная почта и длинное имя', () => {
    const r = checkBuyer({ ...good, email: 'нет', name: 'а'.repeat(101) });
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(['email', 'name']);
  });
});

describe('бронь', () => {
  const lines = (deposit: number | null) => {
    const r = buildOrder([{ offer: 1, quantity: 2 }], [offer({ id: 1, price: 60_000, deposit })]);
    if (!r.ok) throw new Error('заказ не собран');
    return r.lines;
  };

  it('бронь меньше цены идёт в строку; ноль и бронь не меньше цены - без брони', () => {
    expect(lines(10_000)[0]?.deposit).toBe(10_000);
    expect(lines(0)[0]?.deposit).toBeNull();
    expect(lines(60_000)[0]?.deposit).toBeNull();
  });

  it('счёт на бронь - своя строка на позицию, основной после брони - цена минус бронь', () => {
    const [line] = lines(10_000);
    expect(depositLines([line!])).toEqual([
      { offer: null, title: 'Бронь: Позиция 1', quantity: 2, price: 10_000 },
    ]);
    expect(paymentPrice(line!, true)).toBe(50_000);
    expect(paymentPrice(line!, false)).toBe(60_000);
  });
});

describe('настройки магазина', () => {
  it('пусто - умолчания: 72 часа, 3 дня, телефон и почта по желанию', () => {
    const s = shopSettings(null);
    expect([s.orderHoldHours, s.invoiceDueDays]).toEqual([STALE_ORDER_HOURS, 3]);
    expect(s.checkout).toEqual({
      phone: 'optional',
      email: 'optional',
      comment: true,
      phoneFormat: 'intl',
    });
  });

  it('негодные сроки - умолчания; оба способа связи спрятать нельзя', () => {
    const s = shopSettings({
      orderHoldHours: -5,
      invoiceDueDays: 1.5,
      checkout: { phone: 'hidden', email: 'hidden' },
    });
    expect([s.orderHoldHours, s.invoiceDueDays]).toEqual([STALE_ORDER_HOURS, 3]);
    expect(s.checkout.phone).toBe('optional');
  });
});

describe('анкета по правилам владельца', () => {
  const base = { name: 'Анна', consent: true };

  it('обязательная почта: без неё отказ у поля почты', () => {
    const r = checkBuyer(
      { ...base, phone: '+7 900 000-00-00' },
      { phone: 'optional', email: 'required', comment: true, phoneFormat: 'intl' },
    );
    expect(!r.ok && Object.keys(r.errors)).toEqual(['email']);
  });

  it('скрытый телефон не принимается и не требуется, нужна почта', () => {
    const rules = {
      phone: 'hidden',
      email: 'optional',
      comment: false,
      phoneFormat: 'intl',
    } as const;
    const r = checkBuyer({ ...base, phone: '+7 900 123-45-67', comment: 'привет' }, rules);
    expect(!r.ok && r.errors.contact).toBe('Почта - чтобы с вами связаться');
    const ok = checkBuyer(
      { ...base, phone: '+7 900 123-45-67', email: 'a@b.ru', comment: 'привет' },
      rules,
    );
    expect(ok.ok && [ok.buyer.phone, ok.buyer.comment]).toEqual(['', '']);
  });
});

describe('сумма за пределом точных целых', () => {
  it('заказ отклоняется, а не считается с потерей точности', () => {
    const r = buildOrder(
      [{ offer: 1, quantity: 1000 }],
      [offer({ id: 1, price: 10_000_000_000_000 })],
    );
    expect(r.ok === false && r.tooLarge).toBe(true);
  });
  it('телефон - номер целиком: обрывок и буквы не проходят, номер со скобками и дефисами проходит', () => {
    const base = { name: 'Анна', consent: true };
    expect(checkBuyer({ ...base, phone: '11111' }).ok).toBe(false);
    expect(checkBuyer({ ...base, phone: '+7 900' }).ok).toBe(false);
    expect(checkBuyer({ ...base, phone: '8 900 abc 12 34' }).ok).toBe(false);
    expect(checkBuyer({ ...base, phone: '+7 (900) 123-45-67' }).ok).toBe(true);
    expect(checkBuyer({ ...base, phone: '89001234567' }).ok).toBe(true);
  });
  it('формат телефона из настроек; неизвестный - международный', () => {
    expect(shopSettings({ checkout: { phoneFormat: 'ru' } }).checkout.phoneFormat).toBe('ru');
    expect(shopSettings({ checkout: { phoneFormat: 'марс' } }).checkout.phoneFormat).toBe('intl');
    const ru = { ...shopSettings({}).checkout, phoneFormat: 'ru' as const };
    const r = checkBuyer({ name: 'Анна', phone: '+44 20 7946 0958', consent: true }, ru);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.phone).toContain('+7 900');
  });
});

describe('шаг покупателя', () => {
  const pay = (status: InvoiceStatus) => ({ kind: 'invoice', purpose: 'payment', status }) as const;
  const deposit = (status: InvoiceStatus) =>
    ({ kind: 'invoice', purpose: 'deposit', status }) as const;
  const refund = (status: InvoiceStatus) =>
    ({ kind: 'refund', purpose: 'payment', status }) as const;

  it('новый, выполненный и отменённый заказ - по состоянию заказа', () => {
    expect(buyerStep('new', [])).toBe('placed');
    expect(buyerStep('done', [pay('paid')])).toBe('done');
    expect(buyerStep('cancelled', [pay('issued')])).toBe('cancelled');
  });

  it('у принятого решает самый срочный счёт', () => {
    expect(buyerStep('accepted', [])).toBe('awaiting-invoice');
    expect(buyerStep('accepted', [pay('paid')])).toBe('paid');
    expect(buyerStep('accepted', [pay('paid'), pay('reported')])).toBe('payment-reported');
    expect(buyerStep('accepted', [pay('reported'), pay('issued')])).toBe('awaiting-payment');
  });

  it('оплаченная бронь без основного счёта - покупатель должен остаток', () => {
    expect(buyerStep('accepted', [deposit('paid')])).toBe('deposit-paid');
    expect(buyerStep('accepted', [deposit('paid'), pay('issued')])).toBe('awaiting-payment');
    expect(buyerStep('accepted', [deposit('paid'), pay('paid')])).toBe('paid');
  });

  it('возврат на шаг не влияет', () => {
    expect(buyerStep('accepted', [pay('paid'), refund('issued')])).toBe('paid');
  });
});

describe('страница корзины', () => {
  it('по умолчанию /cart, свой путь берётся, чужой адрес - нет', () => {
    expect(shopSettings(null).cartHref).toBe('/cart');
    expect(shopSettings({ cartHref: '/shop/cart' }).cartHref).toBe('/shop/cart');
    expect(shopSettings({ cartHref: 'https://evil.example' }).cartHref).toBe('/cart');
    expect(shopSettings({ cartHref: '//evil.example' }).cartHref).toBe('/cart');
  });
});
