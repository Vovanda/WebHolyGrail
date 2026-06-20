'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * SocialLikePopup — оборачивает ❤️/🐾 кнопки в кликабельный wrapper и при клике
 * показывает tooltip-подсказку «Поставьте ♥ в нашем VK сообществе ↗».
 *
 * @remarks
 * 1:1 с legacy `news.php → showLikePopup`. Логика:
 *  - Клик на ❤️ → popup с предложением лайкнуть в VK
 *  - Клик на 🐾 (репост) → popup с «Поделитесь у себя — нажмите 🐾 в VK»
 *  - Popup clamp'ится в viewport, авто-скрывается через 2.4с
 *  - Стрелка-указатель снизу popup'а указывает на ❤️ кнопку
 *
 * Без VK SDK по бренд-причине: VK Widgets тянут чужой CSS/JS, замусоривают
 * страницу. Popup как fallback — пользователь по клику переходит лайкать в VK.
 */
export function SocialLikePopup({
  variant,
  vkGroupUrl,
  children,
  className,
}: {
  readonly variant: 'like' | 'repost';
  readonly vkGroupUrl: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popup, setPopup] = useState<{ left: number; top: number; arrowOffset: number } | null>(
    null,
  );

  useEffect(() => {
    if (!popup) return;
    const t = setTimeout(() => setPopup(null), 2400);
    return () => clearTimeout(t);
  }, [popup]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const btn = btnRef.current;
    if (!btn) return;
    // Логика 1:1 с legacy `news.php → showLikePopup`. Координаты в
    // document-space (page coords, с учётом скролла), `position: absolute`
    // на body. Без scroll-offset popup улетает при скролле.
    const rect = btn.getBoundingClientRect();
    const POPUP_W = 290;
    const MARGIN = 8;
    const targetCenterX = rect.left + rect.width / 2;
    const desired = targetCenterX - POPUP_W / 2;
    const leftViewport = Math.max(MARGIN, Math.min(desired, window.innerWidth - POPUP_W - MARGIN));
    const left = leftViewport + window.scrollX;
    const top = rect.top + window.scrollY; // `translateY(-100%)` ниже сдвигает на высоту popup'а вверх
    const arrowOffset = Math.max(8, Math.min(POPUP_W - 8, targetCenterX - leftViewport));
    setPopup({ left, top, arrowOffset });
  }

  const message =
    variant === 'like' ? 'Поставьте ♥ в нашем' : 'Поделитесь у себя — нажмите 🐾 в нашем';

  return (
    <>
      <button ref={btnRef} type="button" onClick={handleClick} className={className}>
        {children}
      </button>
      {popup && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            left: popup.left,
            top: popup.top,
            // -12px = поднимаем над кнопкой (popup-height + воздух), без
            // знания реального popup-height используем translateY(-100%)
            // + дополнительный margin-top чтобы воздух был
            transform: 'translateY(calc(-100% - 12px))',
          }}
          className="z-[9999] pointer-events-none rounded-lg bg-ink text-bg px-3.5 py-2 text-[12.5px] font-semibold font-sans whitespace-nowrap shadow-[0_6px_20px_rgba(0,0,0,0.22)] max-w-[calc(100vw-16px)]"
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
      )}
    </>
  );
}
