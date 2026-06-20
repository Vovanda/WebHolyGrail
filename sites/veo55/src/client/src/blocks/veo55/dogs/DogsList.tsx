import Link from 'next/link';
import type { DogDoc, MediaRef } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { ContentFrame } from '@/blocks/decor/ContentFrame';

/**
 * DogsList — каталог наших собак (коллекция Dogs). Карточки с главным фото,
 * именем, датой рождения и краткой строкой регалий.
 *
 * Делит на «Кобели» / «Суки» если оба пола есть; иначе один блок.
 *
 * Рендерится на маршруте `/catalog`.
 */
export function DogsList({ dogs }: { readonly dogs: readonly DogDoc[] }) {
  const males = dogs.filter((d) => d.sex === 'male');
  const females = dogs.filter((d) => d.sex === 'female');
  const split = males.length > 0 && females.length > 0;

  return (
    <section className="bg-bg pt-12 md:pt-16 pb-12 md:pb-16">
      <ContentFrame side="none" className="px-6">
        <header className="text-center mb-10 md:mb-12">
          <h1 className="font-display text-3xl md:text-h2 font-semibold text-ink leading-tight">
            Наши собаки
          </h1>
          <div className="mx-auto mt-5 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />
          <p className="mt-4 font-display italic text-muted text-base md:text-lg">
            Восточноевропейские овчарки питомника
          </p>
        </header>

        {dogs.length === 0 ? (
          <p className="text-center text-muted font-display italic">Пока ничего не найдено.</p>
        ) : split ? (
          <>
            <DogsGroup title="Кобели" dogs={males} />
            <div className="h-12 md:h-16" />
            <DogsGroup title="Суки" dogs={females} />
          </>
        ) : (
          <DogsGroup title={null} dogs={dogs} />
        )}
      </ContentFrame>
    </section>
  );
}

function DogsGroup({
  title,
  dogs,
}: {
  readonly title: string | null;
  readonly dogs: readonly DogDoc[];
}) {
  return (
    <div>
      {title && (
        <h2 className="font-sans uppercase tracking-[0.18em] text-[13px] md:text-[14px] font-bold text-muted text-center mb-6">
          {title}
        </h2>
      )}
      <div
        className={cn(
          'grid gap-8 md:gap-10',
          dogs.length === 1 ? 'mx-auto max-w-md' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {dogs.map((dog) => (
          <DogCard key={dog.id} dog={dog} />
        ))}
      </div>
    </div>
  );
}

function DogCard({ dog }: { readonly dog: DogDoc }) {
  const photoUrl = pickMainPhoto(dog);
  const dobLabel = formatDob(dog.dob);
  const topTitles = (dog.titles ?? []).slice(0, 3);

  return (
    <Link
      href={`/dog/${dog.slug}`}
      className={cn(
        'group flex flex-col rounded-[14px] overflow-hidden bg-paper',
        'shadow-[0_6px_18px_rgba(43,34,26,0.08)] hover:shadow-[0_10px_28px_rgba(43,34,26,0.14)]',
        'hover:-translate-y-0.5 transition-all duration-300 ease-out',
      )}
    >
      <div className="relative aspect-[4/5] bg-surface-hover overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={dog.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted font-display italic text-sm">
            Фото скоро
          </div>
        )}
      </div>
      <div className="px-6 py-5 flex-1 flex flex-col">
        <h3 className="font-display text-xl font-semibold text-ink leading-tight">{dog.name}</h3>
        {dobLabel && (
          <p className="mt-1.5 font-display italic text-muted text-sm">род. {dobLabel}</p>
        )}
        {topTitles.length > 0 && (
          <ul className="mt-3 space-y-1 font-display italic text-muted/85 text-[13.5px] leading-snug">
            {topTitles.map((t) => (
              <li key={t.id}>
                {t.text}
                {t.year ? <span className="opacity-75"> · {t.year}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}

function pickMainPhoto(dog: DogDoc): string | undefined {
  const first = (dog.photos ?? [])[0];
  if (!first) return undefined;
  const image = first.image as MediaRef | undefined;
  if (!image || typeof image === 'string') return undefined;
  return image.url;
}

function formatDob(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}
