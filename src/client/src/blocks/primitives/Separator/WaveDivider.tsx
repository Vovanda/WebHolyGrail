import type { BlockNode, SiteSettings } from 'contracts';

/**
 * WaveDivider — декоративный разделитель секций. Поддерживает 4 variants:
 *  - 'wave' (default): двойная SVG-волна (border-color thin lines), 72px высоты
 *  - 'line': прямая accent-полоса с центральным dot
 *  - 'dots': ряд geometric dots (3 крупных accent + small border-dots по бокам)
 *  - 'gradient': fade-out полоса от border к transparent через accent
 *
 * `flipped: true` — зеркало по вертикали (для wave-variant'a).
 */

type Variant = 'wave' | 'line' | 'dots' | 'gradient';

export function WaveDivider({
  node,
}: {
  readonly node: BlockNode & { data?: { variant?: string; flipped?: boolean } };
  readonly settings: SiteSettings;
}) {
  const variant = (node.data?.variant ?? 'wave') as Variant;
  const flipped = node.data?.flipped === true;

  if (variant === 'line') return <LineSep />;
  if (variant === 'dots') return <DotsSep />;
  if (variant === 'gradient') return <GradientSep />;
  return <WaveSep flipped={flipped} />;
}

function WaveSep({ flipped }: { readonly flipped: boolean }) {
  return (
    <div aria-hidden className="h-[72px] w-full leading-none">
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

function LineSep() {
  return (
    <div aria-hidden className="py-8 md:py-10 w-full">
      <div className="mx-auto max-w-wide px-4 sm:px-6">
        <div className="h-px w-full bg-border" />
      </div>
    </div>
  );
}

function DotsSep() {
  return (
    <div aria-hidden className="py-8 md:py-10 w-full flex items-center justify-center gap-2">
      <span className="h-1 w-1 rounded-full bg-border" />
      <span className="h-1.5 w-1.5 rounded-full bg-border" />
      <span className="h-2 w-2 rounded-full bg-accent" />
      <span className="h-2.5 w-2.5 rounded-full bg-accent" />
      <span className="h-2 w-2 rounded-full bg-accent" />
      <span className="h-1.5 w-1.5 rounded-full bg-border" />
      <span className="h-1 w-1 rounded-full bg-border" />
    </div>
  );
}

function GradientSep() {
  return (
    <div aria-hidden className="py-6 md:py-8 w-full">
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--color-border) 30%, var(--color-accent) 50%, var(--color-border) 70%, transparent 100%)',
        }}
      />
    </div>
  );
}
