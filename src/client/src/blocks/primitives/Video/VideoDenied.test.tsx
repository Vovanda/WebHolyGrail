import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VideoDenied } from './VideoDenied';

/**
 * Заглушку видит тот, кому запись пока не открыта. Она обязана объяснить, что
 * происходит, и подсказать следующий шаг - иначе замок остаётся тупиком.
 */

describe('VideoDenied', () => {
  it('без настроек показывает понятный текст, а не пустой прямоугольник', () => {
    const html = renderToStaticMarkup(<VideoDenied reason="not-entitled" />);
    expect(html).toContain('Откроется по коду доступа');
  });

  it('текст и кнопку задаёт владелец', () => {
    const html = renderToStaticMarkup(
      <VideoDenied
        reason="not-entitled"
        settings={{
          title: 'Нужна подписка',
          note: 'Курс открывается после оплаты',
          actionLabel: 'Оформить',
          actionHref: '/pricing',
        }}
      />,
    );
    expect(html).toContain('Нужна подписка');
    expect(html).toContain('Курс открывается после оплаты');
    expect(html).toContain('href="/pricing"');
    expect(html).toContain('Оформить');
  });

  it('кнопка без адреса не рисуется: вести некуда', () => {
    const html = renderToStaticMarkup(
      <VideoDenied reason="not-entitled" settings={{ actionLabel: 'Купить' }} />,
    );
    expect(html).not.toContain('Купить');
  });

  it('пока видео готовится, кнопки нет: идти зрителю некуда', () => {
    const html = renderToStaticMarkup(
      <VideoDenied
        reason="not-ready"
        settings={{
          notReadyTitle: 'Готовим видео',
          actionLabel: 'Оформить',
          actionHref: '/pricing',
        }}
      />,
    );
    expect(html).toContain('Готовим видео');
    expect(html).not.toContain('/pricing');
  });

  it('обложка остаётся на месте и затемняется под текст', () => {
    const html = renderToStaticMarkup(<VideoDenied reason="not-entitled" poster="/cover.jpg" />);
    expect(html).toContain('/cover.jpg');
    expect(html).toContain('bg-ink/55');
  });
});
