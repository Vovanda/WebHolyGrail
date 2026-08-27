'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Метка зрителя поверх записи.
 *
 * @remarks
 * Украсть технически не мешает, зато слив приводит прямо к сливающему: на
 * записи экрана видно, чей это доступ. В отличие от защиты воспроизведения,
 * метка переживает и съёмку экрана, и пересжатие.
 *
 * Метка медленно ходит по кадру: неподвижную закрывают рамкой при обрезке, а
 * гуляющую пришлось бы вырезать покадрово.
 *
 * Ставится только на закрытые записи: открытую и так можно смотреть без
 * условий, и портить её посторонним текстом незачем.
 *
 * Полупрозрачная и мелкая: она должна читаться на стоп-кадре, а не мешать
 * смотреть.
 */
export interface VideoWatermarkProps {
  /** Чем подписываем: имя, почта или номер - что известно о зрителе. */
  readonly label: string;
  /** Через сколько секунд метка переезжает на новое место. */
  readonly moveEverySeconds?: number;
  readonly className?: string;
}

/** Углы, между которыми метка ходит. Середину не занимаем: там смотрят. */
const SPOTS = [
  { top: '8%', left: '6%' },
  { top: '8%', right: '6%' },
  { bottom: '12%', left: '6%' },
  { bottom: '12%', right: '6%' },
  { top: '46%', left: '6%' },
  { top: '46%', right: '6%' },
] as const;

export function VideoWatermark({ label, moveEverySeconds = 25, className }: VideoWatermarkProps) {
  const [spot, setSpot] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setSpot((current) => (current + 1) % SPOTS.length),
      moveEverySeconds * 1000,
    );
    return () => clearInterval(timer);
  }, [moveEverySeconds]);

  if (!label.trim()) return null;

  return (
    <span
      aria-hidden="true"
      style={SPOTS[spot]}
      className={cn(
        // Поверх кадра, но ниже управления: перекрывать кнопки метка не должна.
        'pointer-events-none absolute z-[4] select-none',
        'rounded px-2 py-1 text-[11px] leading-none text-white/45 mix-blend-difference',
        'transition-all duration-1000 ease-in-out',
        className,
      )}
    >
      {label}
    </span>
  );
}
