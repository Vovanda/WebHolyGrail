import type { BlockNode, SiteSettings } from '@veo55/contracts';

interface TimelineEntry {
  readonly year: string;
  readonly icon?: string;
  readonly body: string;
}

/**
 * Timeline — «Наш путь». Стили 1:1 из `veo-ui.css` `.veo-tl`:
 *
 *  - max-width 880, padding-left/right 40, border-left 2px stone
 *  - точка-маркер: 14×14, янтарь, **трёхслойная** (3px кант кремового + 2px stone-обвод)
 *  - год: Cormorant 28px font-weight 600 letter-spacing 0.5
 *  - расстояние между записями: padding-bottom 36
 */
export function Timeline({
  node,
}: {
  readonly node: BlockNode & { data?: { entries?: readonly TimelineEntry[] } };
  readonly settings: SiteSettings;
}) {
  const entries: readonly TimelineEntry[] = node.data?.entries ?? [
    {
      year: '2026',
      icon: '🐾',
      body: 'Помёт литера «Н» получил отметку РКФ «Отборное разведение / Selected Breeding» — высший статус, доступный единицам помётов ВЕО в России.',
    },
    {
      year: '2024',
      icon: '🏆',
      body: 'Участвуем в развитии породы на программах России: «Омская Дружина Императрица» восстановила популяцию ВЕО в Великобритании.',
    },
    {
      year: '2022',
      icon: '📜',
      body: 'Наши собаки вышли в рабочий класс — ОКД и ЗКС с высшими отметками.',
    },
  ];

  return (
    <section className="bg-bg py-12 md:py-16">
      <div className="mx-auto max-w-content px-6">
        <h2 className="text-center font-display text-3xl md:text-h2 font-semibold text-ink">
          Наш путь
        </h2>
        <div className="mx-auto mt-4 mb-10 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />

        {/* veo-tl: max-w 880, padding 40, border-left 2 stone */}
        <ol className="relative mx-auto max-w-[880px] px-10 border-l-2 border-border">
          {entries.map((entry) => (
            <li key={entry.year} className="relative pb-9 last:pb-0">
              {/* Трёхслойная точка: янтарь + кремовый кант 3px + stone-обвод 2px box-shadow */}
              <span
                aria-hidden
                className="
                  absolute -left-[47px] top-2 h-[14px] w-[14px] rounded-full
                  bg-accent border-[3px] border-bg
                "
                style={{ boxShadow: '0 0 0 2px var(--color-border)' }}
              />
              <div className="flex items-baseline gap-3">
                {entry.icon && (
                  <span className="text-lg" aria-hidden>
                    {entry.icon}
                  </span>
                )}
                <h3 className="font-display text-[28px] font-semibold tracking-[0.5px] leading-tight text-ink mb-1">
                  {entry.year}
                </h3>
              </div>
              <p className="text-ink/90 leading-relaxed">{entry.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
