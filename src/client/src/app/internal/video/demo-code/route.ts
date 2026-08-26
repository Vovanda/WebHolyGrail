import { NextResponse } from 'next/server';

/**
 * Выдача демонстрационного кода со своего домена.
 *
 * @remarks
 * Нужен по R15, как и погашение: браузер не ходит в CMS напрямую.
 *
 * Сам генератор включается только флагом окружения на стороне CMS — если он
 * выключен, отсюда придёт тот же отказ, и кнопка на витрине не появится.
 */
export const dynamic = 'force-dynamic';

const CMS_URL = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';

export async function POST(): Promise<NextResponse> {
  const response = await fetch(`${CMS_URL}/api/video/demo-code`, {
    method: 'POST',
    cache: 'no-store',
  }).catch(() => null);

  if (!response) {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(data, { status: response.status });
}
