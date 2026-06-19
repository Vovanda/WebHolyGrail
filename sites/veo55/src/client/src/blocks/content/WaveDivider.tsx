import type { BlockNode, SiteSettings } from '@veo55/contracts';

/**
 * WaveDivider — волнистый разделитель секций как на veo55 (`.veo-div`).
 *
 * @remarks
 * SVG 96px высоты, симметричный изгиб сверху и снизу.
 * Цвет линии — `--color-border` (stone-бежевый), на cream-фоне выглядит мягко.
 *
 * Используется между крупными секциями страницы (Hero → Litter → About → Timeline).
 */
export function WaveDivider({
  node: _node,
  settings: _settings,
}: {
  readonly node: BlockNode;
  readonly settings: SiteSettings;
}) {
  return (
    <div aria-hidden className="h-[96px] w-full leading-none">
      <svg viewBox="0 0 1200 96" preserveAspectRatio="none" className="block w-full h-full">
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
