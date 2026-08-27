import type { BlockNode, CarouselBlockData, CarouselCard, SiteSettings } from 'contracts';

import { CarouselDeck, CarouselItem } from '@/blocks/primitives/Carousel';
import { getChannel, listArticles } from '@/lib/api-client';
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

export async function CarouselSection({ node }: CarouselSectionProps) {
  const data = node.data ?? {};
  const cards = await collectCards(data);

  // Пустая лента страницу не ломает: у только что поставленного блока карточек
  // ещё нет, и рисовать пустую рамку незачем.
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
            {cards.map((card, index) => (
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

/**
 * Карточка, готовая к показу.
 *
 * @remarks
 * У карточки из админки картинка приходит ссылкой на медиа, у записи блога -
 * уже собранным адресом. Готовый адрес рядом избавляет ленту от знания, из
 * какой коллекции пришло изображение.
 */
type CarouselCardView = CarouselCard & { readonly imageUrl?: string };

/**
 * Собирает карточки: заведённые руками либо взятые из живой коллекции.
 *
 * @remarks
 * Лента с источником обновляется сама: вышла новая запись - она появилась на
 * странице, и трогать саму страницу для этого не нужно (R0).
 *
 * Видео берутся с канала автора, где закрытые уже отсеяны: перечень открытой
 * страницы иначе стал бы описью платного для тех, кто его не брал.
 */
async function collectCards(
  data: CarouselBlockData & {
    sourceKind?: string;
    sourceLimit?: number;
    sourceOrder?: string;
    sourceChannel?: string;
  },
): Promise<ReadonlyArray<CarouselCardView>> {
  const kind = data.sourceKind ?? data.source?.kind ?? 'manual';
  if (kind === 'manual') return data.cards ?? [];

  const limit = data.sourceLimit ?? data.source?.limit ?? 8;

  if (kind === 'videos') {
    const channel = data.sourceChannel ?? data.source?.channel ?? '';
    if (!channel) return [];
    const found = await getChannel(channel).catch(() => null);
    if (!found) return [];

    return found.videos.slice(0, limit).map((video) => ({
      title: video.title,
      link: { href: `/@${channel}/v/${video.code}`, label: video.title },
      ...(video.poster ? { imageUrl: video.poster } : {}),
    }));
  }

  if (kind !== 'articles') return [];

  const found = await listArticles({
    limit,
    sort: (data.sourceOrder ?? data.source?.order) === 'oldest' ? 'oldest' : 'newest',
  }).catch(() => null);
  if (!found) return [];

  return found.docs.map((article) => ({
    title: article.title,
    ...(article.lead ? { text: article.lead } : {}),
    link: { href: `/blog/${article.slug}`, label: article.title },
    ...(article.cover?.url ? { imageUrl: article.cover.url } : {}),
  }));
}

function CarouselCardView({ card }: { readonly card: CarouselCardView }) {
  const src = card.imageUrl ?? resolveMediaUrl(card.image?.media);
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
