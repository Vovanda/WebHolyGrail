import type { CSSProperties } from 'react';

const PAW_URL = 'https://veo55.ru/images/sampledata/dog-paw.png';

/**
 * PawTrail — декоративный «след лап» по экрану.
 *
 * @remarks
 * Процедурно генерируется путь = кубическая Bezier-кривая через 4 anchor-точки
 * по диагонали viewport. Шаги размещаются равномерно по `t ∈ [0,1]`, парами
 * (front-paw / back-paw — короткий перпендикулярный offset, чтобы выглядело
 * как настоящая ходьба, не одна линия точек). Углы лап — производная кривой
 * в точке (по направлению движения).
 *
 * Анимация — `animation-delay` на каждую лапу: fade+zoom+слабый translateY,
 * как будто лапка «опускается». stagger через равные шаги в `loopDuration`.
 *
 * Никакого JS на runtime: при первом рендере SSR кладёт всё в DOM, дальше
 * CSS играет анимацию. seed детерминирован → SSR/CSR совпадают, гидратация чистая.
 */
export interface PawTrailProps {
  /** Число лап. По умолчанию 14. */
  readonly count?: number;
  /** Длительность одного цикла «прохода» в сек. По умолчанию 8. */
  readonly loopDuration?: number;
  /** Зациклить или показать один раз. По умолчанию true. */
  readonly loop?: boolean;
  /** Целевая прозрачность каждой лапы. По умолчанию 0.13. */
  readonly opacity?: number;
}

/** 4 anchor точки кривой (в %): start → ctrl1 → ctrl2 → end. S-curve через viewport. */
const CURVE: readonly [number, number][] = [
  [6, 4],
  [85, 28],
  [10, 70],
  [94, 96],
];

function bezier(t: number, p: readonly [number, number][]): [number, number] {
  const [p0, p1, p2, p3] = p as [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
  const it = 1 - t;
  const b0 = it * it * it;
  const b1 = 3 * it * it * t;
  const b2 = 3 * it * t * t;
  const b3 = t * t * t;
  return [
    b0 * p0[0] + b1 * p1[0] + b2 * p2[0] + b3 * p3[0],
    b0 * p0[1] + b1 * p1[1] + b2 * p2[1] + b3 * p3[1],
  ];
}

/** Производная кривой в точке t — направление движения для угла лапы. */
function bezierTangent(t: number, p: readonly [number, number][]): [number, number] {
  const [p0, p1, p2, p3] = p as [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
  const it = 1 - t;
  const dx =
    3 * it * it * (p1[0] - p0[0]) + 6 * it * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
  const dy =
    3 * it * it * (p1[1] - p0[1]) + 6 * it * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
  return [dx, dy];
}

export function PawTrail({
  count = 14,
  loopDuration = 6,
  loop = false,
  opacity = 0.13,
}: PawTrailProps) {
  const paws = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    const [cx, cy] = bezier(t, CURVE);
    const [dx, dy] = bezierTangent(t, CURVE);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    // Парная походка: чётные смещены в одну сторону по нормали, нечётные — в другую.
    const norm = Math.hypot(dx, dy) || 1;
    const sideSign = i % 2 === 0 ? 1 : -1;
    const sideOffset = 2.2; // % от viewport
    const nx = (-dy / norm) * sideOffset * sideSign;
    const ny = (dx / norm) * sideOffset * sideSign;
    const left = cx + nx;
    const top = cy + ny;
    // Stagger: каждая лапа стартует через (i / count) * loopDuration.
    const delay = (i / count) * loopDuration;
    // Лёгкая «природная» вариативность размера.
    const size = 46 + ((i * 13) % 18);
    return { i, left, top, angleDeg, delay, size };
  });

  return (
    <div aria-hidden className="hg-paw-trail">
      {paws.map((p) => (
        <span
          key={p.i}
          style={
            {
              top: `${p.top}%`,
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--hg-rot': `${p.angleDeg + 90}deg`,
              '--hg-delay': `${p.delay}s`,
              '--hg-dur': '1.5s',
              '--hg-op': opacity,
              animationIterationCount: loop ? 'infinite' : '1',
              animationFillMode: loop ? 'both' : 'forwards',
              backgroundImage: `url(${PAW_URL})`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
