import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDogBySlug } from '@/lib/api-client';
import { ourDogToProfile } from '@/lib/dog-profile';
import { lexicalToParagraphs } from '@/lib/lexical-text';
import { DogProfile } from '@/components/dog/DogProfile';

/**
 * `/dog/<slug>` — детальная страница нашей собаки (Payload Dogs).
 *
 * Canonical URL (R13). Slug = `slugify(name)` либо ручной override. Если slug
 * не найден — 404 (no RKF fallback): чужие живут на `/catalog?dog=<rkfId>`.
 *
 * Layout — общий `<DogProfile>` (тот же что у proxy-RKF), наши extras
 * (титулы + описание) рендерятся между родителями и таблицей info.
 *
 * Server Component (R14).
 */
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const dog = await getDogBySlug(slug).catch(() => null);
  if (!dog) return { title: 'Собака не найдена' };
  return {
    title: `${dog.name} · Питомник «Омская Дружина»`,
    description: `Карточка собаки ${dog.name}: регалии, родословная, фото.`,
  };
}

export default async function DogPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const dog = await getDogBySlug(slug);
  if (!dog) notFound();

  const profile = ourDogToProfile(dog);
  const descriptionParagraphs = lexicalToParagraphs(dog.description);
  const hasTitles = (dog.titles?.length ?? 0) > 0;
  const hasDescription = descriptionParagraphs.length > 0;

  const extras =
    hasTitles || hasDescription ? (
      <div className="mb-6">
        {hasTitles && (
          <div className="mt-2">
            <h2 className="font-display text-ink font-bold mb-2.5 pb-1.5 border-b-2 border-[#E5DCC9] text-[18px]">
              Регалии
            </h2>
            <ul className="space-y-1 font-display italic text-muted text-[15.5px]">
              {dog.titles!.map((t, i) => (
                <li key={i}>
                  {t.text}
                  {t.year ? ` · ${t.year}` : ''}
                  {t.place ? ` · ${t.place}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasDescription && (
          <div className="mt-6 font-display italic text-ink text-[16.5px] leading-[1.6]">
            {descriptionParagraphs.map((p, i) => (
              <p key={i} className={i > 0 ? 'mt-3' : undefined}>
                {p}
              </p>
            ))}
          </div>
        )}
      </div>
    ) : null;

  return (
    <>
      <nav
        aria-label="Хлебные крошки"
        className="mx-auto max-w-[880px] px-4 md:px-6 pt-6 text-sm text-muted font-display italic"
      >
        <Link href="/" className="hover:text-accent transition-colors">
          На главную
        </Link>
        <span aria-hidden className="mx-2">
          ·
        </span>
        <Link href="/catalog" className="hover:text-accent transition-colors">
          Каталог собак
        </Link>
      </nav>
      <DogProfile data={profile} extras={extras} />
    </>
  );
}
