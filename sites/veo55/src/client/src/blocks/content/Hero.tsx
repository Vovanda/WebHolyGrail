import type { BlockNode, SiteSettings } from '@veo55/contracts';

/**
 * Hero — top-баннер сайта veo55.
 *
 * @remarks
 * Структура взята из живого veo55:
 *  1. **Banner** — тёмная плашка (`#1d1612` из .veo-banner) на всю ширину с фото
 *     собак (карусель на 2-3 баннера). Сейчас — placeholder-плашка с надписью.
 *  2. **H1 + sub** под баннером — серифные, центр, янтарная подчёркивающая линия.
 *
 * Карусель станет реальной (embla) когда Media поедет в Payload (Шаг 4.4+).
 */
export function Hero({
  node,
  settings,
}: {
  readonly node: BlockNode & {
    data?: { title?: string; subtitle?: string; banners?: readonly { url: string; alt: string }[] };
  };
  readonly settings: SiteSettings;
}) {
  const title = node.data?.title ?? 'Щенки ВЕО с документами РКФ';
  // siteName уже содержит «Питомник ...», не дублируем префикс.
  const subtitle = node.data?.subtitle ?? `${settings.siteName} · Омск`;
  const banners = node.data?.banners ?? [];
  const phone = settings.contacts?.phone;

  return (
    <>
      {/* Banner — тёмная плашка #1d1612 (точно из .veo-banner) */}
      <div className="relative w-full overflow-hidden" style={{ background: '#1d1612' }}>
        {banners.length > 0 ? (
          <div className="relative aspect-[1200/520] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banners[0]!.url}
              alt={banners[0]!.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="relative aspect-[1200/520] w-full flex items-center justify-center">
            <div className="text-center">
              <div className="font-display text-bg/90 text-4xl md:text-6xl font-semibold tracking-wide">
                Есть щенки
              </div>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="mt-4 inline-block font-display text-accent text-2xl md:text-4xl font-semibold hover:text-accent-hover transition-colors"
                >
                  {phone}
                </a>
              )}
              <div className="mt-6 text-bg/40 text-xs uppercase tracking-widest">
                placeholder banner · фото загрузим из CMS
              </div>
            </div>
          </div>
        )}
      </div>

      {/* H1 + sub под баннером */}
      <section className="bg-bg py-10 md:py-14">
        <div className="mx-auto max-w-wide px-6 text-center">
          <h1 className="font-display text-4xl md:text-h1 font-semibold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-3 font-display italic text-muted text-base md:text-lg">{subtitle}</p>
          <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
        </div>
      </section>
    </>
  );
}
