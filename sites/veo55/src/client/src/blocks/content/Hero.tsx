import type { BlockNode, SiteSettings } from '@veo55/contracts';

/**
 * Hero — top-баннер сайта veo55.
 *
 * @remarks
 * Структура из живого veo55:
 *  1. **Banner** — тёмная плашка `#1d1612` с фото собак (карусель на 2-3 фото).
 *     Если фото нет — компактная плашка с phone, не на 60vh.
 *  2. **H1 + sub** под баннером. H1 с янтарным italic акцент-словом (поле
 *     `titleAccent` подставляется в `<b>` место). Subtitle — два варианта:
 *     `subtitle` (desktop, полный «Питомник восточноевропейских овчарок ...»)
 *     и `subtitleShort` (mobile, короткий «Питомник ВЕО ...»). responsive
 *     через Tailwind hidden/inline.
 *
 * Карусель станет реальной (embla) когда понадобится >1 баннера.
 */
export interface HeroData {
  /** Полный текст заголовка (на месте акцент-слова — литерал `{accent}`). */
  readonly title?: string;
  /** Акцент-слово в title (заменит `{accent}`). Янтарный italic Cormorant. */
  readonly titleAccent?: string;
  /** Подзаголовок на desktop (полная форма). */
  readonly subtitle?: string;
  /** Подзаголовок на mobile (≤md). Если пусто — `subtitle` показывается на всех экранах. */
  readonly subtitleShort?: string;
  /** Текст-метка над H1 в баннере (на тёмной плашке). */
  readonly bannerHeading?: string;
  /** Баннеры (фото) на тёмной плашке сверху. Если 0 — компактная плашка с phone. */
  readonly banners?: readonly { url: string; alt: string }[];
}

export function Hero({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: HeroData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const title = data.title ?? 'Щенки {accent} с документами РКФ';
  const titleAccent = data.titleAccent ?? 'ВЕО';
  const subtitle =
    data.subtitle ?? `Питомник восточноевропейских овчарок «Омская Дружина» · г. Омск`;
  const subtitleShort = data.subtitleShort ?? `Питомник ВЕО «Омская Дружина» · г. Омск`;
  const bannerHeading = data.bannerHeading ?? 'Есть щенки';
  const banners = data.banners ?? [];
  const phone = settings.contacts?.phone;

  // Title split on {accent} marker → ['Щенки ', ' с документами РКФ']
  const [titleHead, titleTail = ''] = title.split('{accent}');

  return (
    <>
      {/* Banner — тёмная плашка #1d1612. С фото — full-bleed aspect; без фото — компактная. */}
      <div className="relative w-full overflow-hidden" style={{ background: '#1d1612' }}>
        {banners.length > 0 ? (
          <div className="relative aspect-[1200/520] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banners[0]!.url}
              alt={banners[0]!.alt}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <BannerOverlay heading={bannerHeading} phone={phone} />
          </div>
        ) : (
          // Без фото — компактнее: 200-280px вместо 520px
          <div className="w-full py-8 md:py-12 flex items-center justify-center">
            <BannerInline heading={bannerHeading} phone={phone} />
          </div>
        )}
      </div>

      {/* H1 + sub под баннером */}
      <section className="bg-bg py-10 md:py-14">
        <div className="mx-auto max-w-wide px-6 text-center">
          <h1 className="font-display text-3xl md:text-h1 font-semibold leading-tight tracking-tight text-ink">
            {titleHead}
            <b className="text-accent italic font-semibold">{titleAccent}</b>
            {titleTail}
          </h1>
          <p className="mt-3 font-display italic text-muted text-base md:text-lg">
            {/* Mobile / desktop вариант subtitle. */}
            <span className="md:hidden">{subtitleShort}</span>
            <span className="hidden md:inline">{subtitle}</span>
          </p>
          <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
        </div>
      </section>
    </>
  );
}

function BannerInline({
  heading,
  phone,
}: {
  readonly heading: string;
  readonly phone?: string | undefined;
}) {
  return (
    <div className="text-center">
      <div className="font-display text-bg text-3xl md:text-5xl font-semibold tracking-wide">
        {heading}
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="mt-2 inline-block font-display text-accent text-2xl md:text-3xl font-semibold hover:text-accent-hover transition-colors"
        >
          {phone}
        </a>
      )}
    </div>
  );
}

function BannerOverlay({
  heading,
  phone,
}: {
  readonly heading: string;
  readonly phone?: string | undefined;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
      <div className="font-display text-bg text-4xl md:text-6xl font-semibold tracking-wide drop-shadow-md">
        {heading}
      </div>
      {phone && (
        <a
          href={`tel:${phone}`}
          className="mt-3 inline-block font-display text-accent text-3xl md:text-5xl font-semibold drop-shadow-md hover:text-accent-hover transition-colors"
        >
          {phone}
        </a>
      )}
    </div>
  );
}
