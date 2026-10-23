import type { Metadata } from 'next';

import { MyOrders } from '@/blocks/primitives/Shop/MyOrders';

export const metadata: Metadata = {
  title: 'Мои заказы',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/** Заказы, которые оформляли в этом браузере: на случай, если ссылку не сохранили. */
export default function OrdersPage() {
  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h1 data-part="title" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Мои заказы
        </h1>
        <p className="mt-2 mb-6 text-sm text-muted">
          Заказы, оформленные в этом браузере. С другого устройства заказ открывается по своей
          ссылке.
        </p>
        <MyOrders />
      </div>
    </section>
  );
}
