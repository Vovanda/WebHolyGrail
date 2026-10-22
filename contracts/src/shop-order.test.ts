import { describe, expect, it } from 'vitest';

import {
  buildOrder,
  checkBuyer,
  cleanCart,
  depositLines,
  MAX_QUANTITY,
  type OfferSnapshot,
  paymentPrice,
} from './shop';

const offer = (o: Partial<OfferSnapshot> & { id: number }): OfferSnapshot => ({
  title: `Позиция ${o.id}`,
  price: 10_000,
  stock: null,
  access: null,
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
          access: null,
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

  it('позиция с доступом несёт его в строку', () => {
    const r = buildOrder([{ offer: 5, quantity: 1 }], [offer({ id: 5, access: 42 })]);
    expect(r.ok && r.lines[0]?.access).toBe(42);
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
