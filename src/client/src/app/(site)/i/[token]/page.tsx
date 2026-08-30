import type { Metadata } from 'next';

import { InviteAccept } from '@/blocks/primitives/Video/InviteAccept';

/**
 * Страница приглашения: `/i/<адрес>`.
 *
 * @remarks
 * Короткий путь затем, чтобы присланная ссылка целиком помещалась в строку
 * сообщения. Сама страница почти ничего не показывает: она берёт токен зрителя
 * и отдаёт его приёмнику, который гасит ссылку и уводит к содержимому.
 *
 * Из поиска страница исключена: адрес приглашения не должен попасть в выдачу -
 * это ключ, а не публичный раздел.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Приглашение',
  robots: { index: false, follow: false },
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token: link } = await params;
  return <InviteAccept link={link} />;
}
