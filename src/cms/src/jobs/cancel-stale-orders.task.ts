import type { TaskConfig } from 'payload';

import { cancelStaleOrders } from '../lib/shop/orders';
import { payloadAccess } from '../lib/shop/payload-access';
import { payloadPorts } from '../lib/shop/payload-store';

/**
 * Отмена новых заказов, которые менеджер не принял за 72 часа.
 *
 * @remarks
 * Новый заказ держит остаток. Оформленный ради шутки заказ на щенка без этой
 * задачи убирает его из витрины без срока (docs/whg/43-shop.md). Отмена идёт
 * тем же сценарием и через ту же таблицу переходов, что и кнопка менеджера,
 * участником «система».
 *
 * Раз в час: срок в сутках, точнее не нужно.
 */
export const CancelStaleOrdersTask: TaskConfig<'cancel-stale-orders'> = {
  slug: 'cancel-stale-orders',
  retries: 1,
  inputSchema: [],
  outputSchema: [{ name: 'cancelled', type: 'number' }],
  schedule: [{ cron: '23 * * * *', queue: 'default' }],
  handler: async ({ req }) => {
    const cancelled = await cancelStaleOrders(
      payloadPorts(req.payload, payloadAccess(req.payload)),
    );
    return { output: { cancelled } };
  },
};
