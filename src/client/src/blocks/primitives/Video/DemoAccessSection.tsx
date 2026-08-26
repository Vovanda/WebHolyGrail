import type { BlockNode, DemoAccessBlockData } from 'contracts';

import { issueVideoToken } from '@/lib/api-client';

import { DemoAccessPanel } from './DemoAccessPanel';

/**
 * DemoAccessSection — серверная обёртка пробы доступа по коду.
 *
 * @remarks
 * Токен зрителя выписывается на сервере (R14): именно в него погашенный код
 * дописывает набор, и в браузере его взять неоткуда.
 */
export interface DemoAccessSectionProps {
  readonly node: BlockNode;
  readonly className?: string;
}

export async function DemoAccessSection({ node, className }: DemoAccessSectionProps) {
  const data = (node.data ?? {}) as unknown as DemoAccessBlockData;
  const token = await issueVideoToken();
  if (!token) return null;

  return (
    <DemoAccessPanel
      token={token}
      heading={data.heading?.trim() || undefined}
      text={data.text?.trim() || undefined}
      className={className}
    />
  );
}
