import type { BlockNode, SiteSettings } from 'contracts';

import { renderAccentHeading } from '@/lib/heading-accent';

/**
 * Hero — секция с главным заголовком сайта (H1 + подзаголовок).
 *
 * @remarks
 * Самостоятельный блок — только текстовая часть. Баннеры (фото-слайдер)
 * идут отдельным блоком `BannerSliderBlock` выше или ниже по странице.
 *
 * H1 поддерживает акцентное слово через маркер `{accent}` в поле title.
 * Subtitle адаптирует длину на mobile через `subtitleShort`.
 */
export interface HeroData {
  /** Полный текст заголовка; `{accent}` — место для янтарного слова. */
  readonly title?: string;
  /** Акцент-слово (заменит `{accent}`). Набирается акцентным цветом. */
  readonly titleAccent?: string;
  /** Подзаголовок на desktop (полная форма). */
  readonly subtitle?: string;
  /** Подзаголовок на mobile (≤md). Если пусто — `subtitle` на всех экранах. */
  readonly subtitleShort?: string;
}

export function Hero({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: HeroData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const title = data.title?.trim() || settings.siteName;
  const titleAccent = data.titleAccent?.trim() ?? '';
  const subtitle = data.subtitle?.trim() ?? '';
  const subtitleShort = data.subtitleShort?.trim() || subtitle;

  /*
    Акцент - часть самого заголовка: владелец пишет заголовок целиком, а рядом
    указывает, что в нём выделить. Регистр не важен, несколько кусков
    перечисляются чертой: «видео|сайте».

    Прежняя запись с меткой продолжает работать - у кого она уже стоит в тексте,
    у того ничего не поедет.
  */
  // Выделяемая часть заголовка ищется общим способом - тем же, что у соседних блоков.

  return (
    <section className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-wide px-6 text-center">
        <h1
          data-part="title"
          className="font-display text-3xl md:text-h1 font-semibold leading-tight tracking-tight text-ink"
        >
          {renderAccentHeading(title, titleAccent)}
        </h1>
        {subtitle || subtitleShort ? (
          <p data-part="subtitle" className="mt-3 font-display text-muted text-base md:text-lg">
            <span className="md:hidden">{subtitleShort}</span>
            <span className="hidden md:inline">{subtitle || subtitleShort}</span>
          </p>
        ) : null}
        <div className="mx-auto mt-4 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
      </div>
    </section>
  );
}
