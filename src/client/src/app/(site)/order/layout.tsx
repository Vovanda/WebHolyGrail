import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { isModuleEnabled } from 'contracts';

import { getToggles } from '@/lib/api-client.engine';

/** Модуль «Магазин» выключен - страница заказа по ссылке отвечает 404. */
export default async function OrderLayout({ children }: { readonly children: ReactNode }) {
  if (!isModuleEnabled(await getToggles(), 'shop')) notFound();
  return children;
}
