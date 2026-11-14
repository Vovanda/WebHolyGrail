import type { Metadata } from 'next';

import { MyOrders } from '@/blocks/primitives/Shop/MyOrders';

export const metadata: Metadata = {
  title: 'Мои заказы',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

/** Заказы, которые оформляли в этом браузере: на случай, если ссылку не сохранили. */
export default async function OrdersPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams)['page'];
  const page = typeof raw === 'string' && /^\d{1,4}$/.test(raw) ? Number(raw) : 1;
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
        <MyOrders page={page} />
      </div>
    </section>
  );
}
