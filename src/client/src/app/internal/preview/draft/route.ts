import { NextResponse } from 'next/server';

import { expandDraft } from '@/lib/api-client';
import { editorPassFrom } from '@/lib/editor';
import { previewDrafts, readPreviewDraftRequest } from '@/lib/preview-draft';

/**
 * Правка из панели предпросмотра - на страницу до сохранения.
 *
 * @remarks
 * Панель присылает содержимое формы, CMS разворачивает его без записи,
 * и развёрнутое ложится в память под пропуском редактора. Страница, которую
 * панель следом перечитывает, берёт документ оттуда.
 *
 * Без пропуска маршрут не делает ничего: посетителю черновик не положен,
 * а право на него проверяет сама CMS по тому же пропуску.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const pass = editorPassFrom(request.headers.get('cookie') ?? '');
  if (!pass) return NextResponse.json({ error: 'no-editor' }, { status: 401 });

  const draft = readPreviewDraftRequest(await request.json().catch(() => null));
  if (!draft) return NextResponse.json({ error: 'bad-request' }, { status: 400 });

  const doc = await expandDraft({ ...draft, viewer: pass });
  if (!doc) return NextResponse.json({ error: 'unavailable' }, { status: 502 });

  previewDrafts().put(pass, draft.collection, draft.id, doc);
  return new NextResponse(null, { status: 204 });
}
