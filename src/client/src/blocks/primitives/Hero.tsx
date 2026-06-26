import type { BlockNode, SiteSettings } from 'contracts';

/**
 * Hero — секция с главным заголовком сайта (H1 + подзаголовок).
 *
 * @remarks
 * Самостоятельный блок — только текстовая часть. Баннеры (фото-слайдер)
 * идут отдельным блоком `BannerSliderBlock` выше или ниже по странице.
 *
 * H1 поддерживает янтарное italic акцент-слово через маркер `{accent}` в поле title.
 * Subtitle адаптирует длину на mobile через `subtitleShort`.
 */
export interface HeroData {
  /** Полный текст заголовка; `{accent}` — место для янтарного слова. */
  readonly title?: string;
  /** Акцент-слово (заменит `{accent}`). Янтарный italic Cormorant. */
  readonly titleAccent?: string;
  /** Подзаголовок на desktop (полная форма). */
  readonly subtitle?: string;
  /** Подзаголовок на mobile (≤md). Если пусто — `subtitle` на всех экранах. */
  readonly subtitleShort?: string;
}

export function Hero({
  node,
}: {
  readonly node: BlockNode & { data?: HeroData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  // Generic placeholders — реальные значения приходят из Payload (поля title/subtitle).
  const title = data.title ?? 'Lorem ipsum {accent} dolor sit amet';
  const titleAccent = data.titleAccent ?? 'consectetur';
  const subtitle = data.subtitle ?? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  const subtitleShort = data.subtitleShort ?? 'Lorem ipsum dolor sit amet.';

  const [titleHead, titleTail = ''] = title.split('{accent}');

  return (
    <section className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-wide px-6 text-center">
        <h1 className="font-display text-3xl md:text-h1 font-semibold leading-tight tracking-tight text-ink">
          {titleHead}
          <b className="text-accent italic font-semibold">{titleAccent}</b>
          {titleTail}
        </h1>
        <p className="mt-3 font-display italic text-muted text-base md:text-lg">
          <span className="md:hidden">{subtitleShort}</span>
          <span className="hidden md:inline">{subtitle}</span>
        </p>
        <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
      </div>
    </section>
  );
}
