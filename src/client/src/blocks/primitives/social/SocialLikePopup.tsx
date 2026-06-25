'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SocialLikePopupRoot — глобальный слушатель кликов на ❤️/🐾 в постах и комментах,
 * показывает tooltip-подсказку «Поставьте ♥ в нашем VK сообществе ↗».
 *
 * @remarks
 * 1:1 с legacy `news.html → showLikePopup` — там один `document.addEventListener('click')`
 * ловит селекторы `.veo-cm__likes, .veo-post__likes` и `.veo-post__reposts`. У нас
 * вместо классов — атрибут `data-like-popup="like|repost"`, любой элемент с этим
 * атрибутом триггерит подсказку. Это позволяет одинаково покрывать посты и
 * комменты (раньше комментные сердечки попап не показывали — wrapper-component
 * подключался только в SocialPostCard).
 *
 * Подключается один раз в `RootLayout` (как `DogDetailDrawerRoot`).
 *
 * Без VK SDK по бренд-причине: VK Widgets тянут чужой CSS/JS. Popup как
 * fallback — пользователь по клику переходит лайкать в VK сам.
 */
export function SocialLikePopupRoot({ vkGroupUrl }: { readonly vkGroupUrl: string }) {
  const [popup, setPopup] = useState<{
    readonly left: number;
    readonly top: number;
    readonly arrowOffset: number;
    readonly variant: 'like' | 'repost';
  } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const trigger = target.closest('[data-like-popup]') as HTMLElement | null;
      if (!trigger) return;
      const variant = (trigger.dataset.likePopup ?? 'like') as 'like' | 'repost';
      e.preventDefault();
      const rect = trigger.getBoundingClientRect();
      // Логика 1:1 с legacy `showLikePopup`: координаты в document-space
      // (rect + scrollX/scrollY), позиционирование `absolute` на body.
      const POPUP_W = 290;
      const MARGIN = 8;
      const targetCenterX = rect.left + rect.width / 2;
      const desired = targetCenterX - POPUP_W / 2;
      const leftViewport = Math.max(
        MARGIN,
        Math.min(desired, window.innerWidth - POPUP_W - MARGIN),
      );
      const arrowOffset = Math.max(8, Math.min(POPUP_W - 8, targetCenterX - leftViewport));
      setPopup({
        left: leftViewport + window.scrollX,
        top: rect.top + window.scrollY,
        arrowOffset,
        variant,
      });
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 2400);
    return () => clearTimeout(t);
  }, [popup]);

  if (!popup) return null;
  const message =
    popup.variant === 'like' ? 'Поставьте ♥ в нашем' : 'Поделитесь у себя — нажмите 🐾 в нашем';

  return (
    <div
      ref={popupRef}
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        left: popup.left,
        top: popup.top,
        // `translateY(-100% - 12px)`: поднимаем popup над сердечком + 12px воздуха.
        // У нас фиксированная ширина 290 — стрелка позиционируется отдельно по
        // `arrowOffset` так, чтобы указывать ровно на центр сердечка даже когда
        // popup clamp'нулся в viewport.
        transform: 'translateY(calc(-100% - 12px))',
        width: 290,
      }}
      className="z-[9999] pointer-events-none rounded-lg bg-ink text-bg px-3.5 py-2 text-[12.5px] font-semibold font-sans text-center shadow-[0_6px_20px_rgba(0,0,0,0.22)]"
    >
      <span
        aria-hidden
        style={{ left: popup.arrowOffset }}
        className="absolute -bottom-[5px] -translate-x-1/2 w-0 h-0 border-x-[5px] border-x-transparent border-t-[5px] border-t-ink"
      />
      {message}{' '}
      <a
        href={vkGroupUrl}
        target="_blank"
        rel="noopener"
        className="text-accent-soft underline decoration-accent decoration-[1.5px] underline-offset-[3px] pointer-events-auto"
      >
        VK сообществе ↗
      </a>
    </div>
  );
}
