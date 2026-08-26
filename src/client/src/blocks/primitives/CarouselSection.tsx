import type { BlockNode, CarouselBlockData, CarouselCard, SiteSettings } from 'contracts';

import { CarouselDeck, CarouselItem } from '@/blocks/primitives/Carousel';
import { resolveMediaUrl } from '@/lib/media';

/**
 * Карусель как секция страницы.
 *
 * @remarks
 * Тонкая обёртка над примитивом: берёт описание из админки и раскладывает его
 * в карточки. Сама механика листания живёт в примитиве, поэтому лента здесь
 * ведёт себя ровно так же, как в наборе видео или на витрине.
 *
 * Серверная (R14): выбирать и раскладывать карточки браузеру незачем.
 */
export interface CarouselSectionProps {
  readonly node: BlockNode & { data?: CarouselBlockData & { sourceKind?: string } };
  readonly settings: SiteSettings;
  readonly className?: string;
}

export function CarouselSection({ node }: CarouselSectionProps) {
  const data = node.data ?? {};
  const cards = data.cards ?? [];

  // Живые коллекции подключаются следующим шагом: до тех пор лента показывает
  // то, что завели руками, и пустой блок страницу не ломает.
  if (cards.length === 0) return null;

  const autoplay = data.autoplaySeconds ? data.autoplaySeconds * 1000 : undefined;

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto w-full max-w-wide px-6">
        {data.heading && (
          <h2 className="font-display text-h3 font-semibold tracking-tight text-ink md:text-h2">
            {data.heading}
          </h2>
        )}
        {data.subtitle && <p className="mt-3 text-body text-muted">{data.subtitle}</p>}

        <div className="mt-8">
          <CarouselDeck
            mode={data.mode === 'single' ? 'single' : 'row'}
            arrows={data.arrows ?? true}
            dots={data.dots ?? false}
            loop={data.loop ?? false}
            autoplay={autoplay}
            aspect={data.aspect}
            label={data.heading}
          >
            {cards.map((card: CarouselCard, index: number) => (
              <CarouselItem
                key={index}
                width={data.mode === 'single' ? 'full' : (data.cardWidth ?? 'min(18rem, 80vw)')}
              >
                <CarouselCardView card={card} />
              </CarouselItem>
            ))}
          </CarouselDeck>
        </div>
      </div>
    </section>
  );
}

function CarouselCardView({ card }: { readonly card: CarouselCard }) {
  const src = resolveMediaUrl(card.image?.media);
  const body = (
    <>
      {src && (
        <img
          src={src}
          alt={card.image?.alt ?? card.title ?? ''}
          loading="lazy"
          className="aspect-video w-full rounded-lg object-cover"
        />
      )}
      {card.title && <p className="mt-3 text-body font-medium text-ink">{card.title}</p>}
      {card.text && <p className="mt-1 text-sm text-muted">{card.text}</p>}
    </>
  );

  if (card.link?.href) {
    return (
      <a
        href={card.link.href}
        {...(card.link.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        className="block rounded-xl border border-border bg-paper p-3 transition-colors hover:border-border-strong"
      >
        {body}
      </a>
    );
  }

  return <div className="rounded-xl border border-border bg-paper p-3">{body}</div>;
}
