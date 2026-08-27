import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { VideoWatermark } from './VideoWatermark';

/**
 * Метка должна читаться на стоп-кадре и не мешать смотреть: она поверх кадра,
 * но ниже управления и не ловит нажатия.
 */

describe('VideoWatermark', () => {
  it('подпись видна в разметке', () => {
    const html = renderToStaticMarkup(<VideoWatermark label="viewer@example.com" />);
    expect(html).toContain('viewer@example.com');
  });

  it('нажатия метка не перехватывает', () => {
    const html = renderToStaticMarkup(<VideoWatermark label="viewer@example.com" />);
    expect(html).toContain('pointer-events-none');
    expect(html).toContain('select-none');
  });

  it('от чтения с экрана скрыта: зрителю её объявлять незачем', () => {
    const html = renderToStaticMarkup(<VideoWatermark label="viewer@example.com" />);
    expect(html).toContain('aria-hidden="true"');
  });

  it('пустая подпись метку не рисует', () => {
    expect(renderToStaticMarkup(<VideoWatermark label="   " />)).toBe('');
  });

  it('первое место - у края, а не посреди кадра', () => {
    const html = renderToStaticMarkup(<VideoWatermark label="кто-то" />);
    expect(html).toMatch(/top:\s*8%/);
  });
});
