import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

import { isModuleEnabled } from 'contracts';

import { getToggles } from '@/lib/api-client.engine';

/** Модуль «Блог» выключен - все страницы блога отвечают 404. */
export default async function BlogLayout({ children }: { readonly children: ReactNode }) {
  if (!isModuleEnabled(await getToggles(), 'blog')) notFound();
  return children;
}
