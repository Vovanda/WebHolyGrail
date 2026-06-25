import type { BlockNode, SiteSettings } from 'contracts';

/**
 * WaveDivider — волнистый разделитель секций. SVG 72px высоты.
 * `flipped: true` → зеркально по вертикали (для чередования между секциями).
 */
export function WaveDivider({
  node,
}: {
  readonly node: BlockNode & { data?: { flipped?: boolean } };
  readonly settings: SiteSettings;
}) {
  const flipped = node.data?.flipped === true;
  return (
    <div aria-hidden className="h-[72px] -my-8 md:-my-10 w-full leading-none">
      <svg
        viewBox="0 0 1200 96"
        preserveAspectRatio="none"
        className="block w-full h-full"
        style={flipped ? { transform: 'scaleY(-1)' } : undefined}
      >
        <path
          d="M0,48 C200,8 400,88 600,48 C800,8 1000,88 1200,48"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M0,52 C200,12 400,92 600,52 C800,12 1000,92 1200,52"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
