import type { BlockNode, MediaRef, SiteSettings } from 'contracts';

import { MediaImage } from '@/blocks/primitives/Media';
import { renderAccentHeading } from '@/lib/heading-accent';
import { veilOpacity } from '@/lib/veil';

/**
 * Hero — секция с главным заголовком сайта (H1 + подзаголовок).
 *
 * @remarks
 * Текст по центру. Фото, если задано, ложится под него во всю ширину блока,
 * а вуаль цвета фона темы держит текст читаемым на любом кадре и в обеих
 * темах. Раскладка от фото не меняется. Слайдер снимков - отдельный блок
 * `BannerSliderBlock`.
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
  /** Фото под текстом; пусто - блок без фото. */
  readonly photo?: MediaRef | null;
  /** Вуаль цвета фона темы над фото, 0-95 %. Пусто - 60. */
  readonly veil?: number | null;
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

  const photo = data.photo && typeof data.photo === 'object' ? data.photo : null;
  const veil = veilOpacity(data.veil, 60);

  return (
    <section className="block-space relative overflow-hidden bg-bg">
      {photo ? (
        <>
          <MediaImage
            media={photo}
            place="100vw"
            alt=""
            zoom={false}
            loading="eager"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full bg-transparent object-cover"
          />
          <div
            data-part="veil"
            aria-hidden
            className="absolute inset-0 bg-page-bg"
            style={{ opacity: veil }}
          />
        </>
      ) : null}
      <div className="relative mx-auto max-w-wide px-6 text-center">
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
