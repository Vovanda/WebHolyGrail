import type { ReactNode } from 'react';

/**
 * PageOutlet — спец-блок системного уровня.
 *
 * @remarks
 * Туда, где он стоит в layout-конфиге (обычно в slot `center`), Layout Engine
 * подставляет содержимое страничного маршрута (`app/(site)/[slug]/page.tsx`).
 * Это позволяет одной layout-конфигурации обслуживать все страницы сайта.
 *
 * Если в layout-конфиге PageOutlet нет — содержимое страниц нигде не покажется.
 * SiteLayout это проверяет в dev-режиме с предупреждением.
 */
export function PageOutlet({ children }: { readonly children?: ReactNode }) {
  return <>{children}</>;
}
