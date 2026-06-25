'use client';

import { useCallback } from 'react';

import { formatCompactNumber } from './format';

/**
 * Кликабельный 💬-чип в footer'е поста — toggle для `<details>` с комментами
 * этого же поста + scrollIntoView (1:1 с legacy `news.html → click on
 * [data-toggle-comments]`).
 *
 * Связывается с `<details data-comments-of={postId}>` через DOM query — не
 * через React-state, чтобы PostCard оставался server-component'ом
 * (single client island для интерактивности).
 */
export function CommentsToggleButton({
  postId,
  count,
}: {
  readonly postId: string;
  readonly count: number;
}) {
  const onClick = useCallback(() => {
    const details = document.querySelector<HTMLDetailsElement>(
      `details[data-comments-of="${CSS.escape(postId)}"]`,
    );
    if (!details) return;
    details.open = !details.open;
    if (details.open) {
      details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [postId]);

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 transition-transform hover:scale-110 cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
    >
      <span className="text-base">💬</span>
      <strong className="text-ink font-semibold">{formatCompactNumber(count)}</strong>
    </button>
  );
}
