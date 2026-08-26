import type { BlockNode, DemoAccessBlockData } from 'contracts';

import { DemoAccessPanel } from './DemoAccessPanel';

/**
 * DemoAccessSection — серверная обёртка пробы доступа по коду.
 *
 * @remarks
 * Токен здесь не нужен: код вводится в окне, которое живёт рядом с набором,
 * и токен берётся там же.
 */
export interface DemoAccessSectionProps {
  readonly node: BlockNode;
  readonly className?: string;
}

export async function DemoAccessSection({ node, className }: DemoAccessSectionProps) {
  const data = (node.data ?? {}) as unknown as DemoAccessBlockData;
  return (
    <DemoAccessPanel
      heading={data.heading?.trim() || undefined}
      text={data.text?.trim() || undefined}
      className={className}
    />
  );
}
