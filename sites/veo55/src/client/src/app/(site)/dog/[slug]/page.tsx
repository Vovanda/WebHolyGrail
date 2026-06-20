import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDogBySlug } from '@/lib/api-client';
import { lexicalToParagraphs } from '@/lib/lexical-text';

/**
 * `/dog/<slug>` — детальная страница НАШЕЙ собаки (Payload Dogs).
 *
 * @remarks
 * **Canonical URL** для собаки (R13). Slug = `slugify(name)` (или ручной короткий
 * override через админку). Все ссылки на собаку с других мест ведут сюда.
 *
 * **Только наши.** Если в Payload Dogs slug не найден — 404 (no RKF fallback).
 * Чужие собаки живут в `/catalog/<slug>` или `/catalog?q=<phrase>` —
 * live-proxy к РКФ.
 *
 * **Server Component (R14)** — БД-fetch на сервере, без `'use client'`.
 *
 * @todo D2 расширения:
 *  - `<link rel="canonical">`, og:url, og:title=name, og:image=photos[0]
 *  - slugHistory[] → 301 redirect для старых slug'ов
 *  - DetailDialog overlay вариант (на главной/каталоге кличка открывает overlay,
 *    тут же — полная страница)
 *  - Родословная (mother/father → ссылки на их страницы)
 *  - Lightbox для галереи фото
 *  - Темная типография, акцентные плашки регалий
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

  const descriptionParagraphs = lexicalToParagraphs(dog.description);
  const sexLabel = dog.sex === 'male' ? 'Кобель' : 'Сука';
  const dobLabel = dog.dob ? formatDob(dog.dob) : null;
  const colorLabel = formatColor(dog.color);
  const mainPhoto = dog.photos?.[0]?.image;
  const mainPhotoUrl = mainPhoto && typeof mainPhoto === 'object' ? mainPhoto.url : null;
  const mainPhotoAlt =
    mainPhoto && typeof mainPhoto === 'object' ? (mainPhoto.alt ?? dog.name) : dog.name;

  return (
    <section className="bg-bg pt-12 md:pt-16 pb-16 md:pb-20">
      <div className="mx-auto max-w-[1150px] px-6">
        <nav aria-label="Хлебные крошки" className="mb-8 text-sm text-muted font-display italic">
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

        <div className="grid gap-10 lg:grid-cols-[2fr_3fr] items-start">
          <div className="space-y-4">
            {mainPhotoUrl ? (
              <img
                src={mainPhotoUrl}
                alt={mainPhotoAlt}
                className="w-full h-auto rounded-[14px] shadow-[0_8px_24px_rgba(43,34,26,0.12)]"
              />
            ) : (
              <div className="aspect-[4/5] bg-surface-hover rounded-[14px] flex items-center justify-center text-muted font-display italic">
                Фото скоро
              </div>
            )}
            {dog.photos && dog.photos.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {dog.photos.slice(1, 7).map((p, i) => {
                  const url = typeof p.image === 'object' ? p.image.url : null;
                  if (!url) return null;
                  return (
                    <img
                      key={i}
                      src={url}
                      alt={dog.name}
                      className="w-full h-full aspect-square object-cover rounded-md shadow-[0_4px_12px_rgba(43,34,26,0.08)]"
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="font-sans uppercase tracking-[0.1em] text-xs text-muted">
              Питомник «Омская Дружина»
            </p>
            <h1 className="mt-2 font-display text-3xl md:text-h2 font-semibold text-ink leading-tight uppercase">
              {dog.name}
            </h1>

            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-display text-muted text-base">
              <dt className="italic">Пол</dt>
              <dd className="text-ink">{sexLabel}</dd>
              {dobLabel && (
                <>
                  <dt className="italic">Дата рождения</dt>
                  <dd className="text-ink">{dobLabel}</dd>
                </>
              )}
              {colorLabel && (
                <>
                  <dt className="italic">Окрас</dt>
                  <dd className="text-ink">{colorLabel}</dd>
                </>
              )}
              {/*
               * Родословная — не показываем ссылку на внешний ресурс РКФ (legacy
               * поле `dog.pedigreeUrl`). Когда заведём `/catalog/<rkfId>` как
               * проксированную карточку РКФ — поставим линк туда.
               *
               * TODO(holygrail-pedigree-internal): родословная как внутренняя
               * страница `/dog/<slug>/pedigree` (генеалогическое дерево) или
               * `/catalog/<rkfId>` (проксированная карточка РКФ).
               */}
            </dl>

            {dog.titles && dog.titles.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-xl font-semibold text-ink mb-3">Регалии</h2>
                <ul className="space-y-1 font-display italic text-muted text-base">
                  {dog.titles.map((t, i) => (
                    <li key={i}>
                      {t.text}
                      {t.year ? ` · ${t.year}` : ''}
                      {t.place ? ` · ${t.place}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {descriptionParagraphs.length > 0 && (
              <div className="mt-8 font-display italic text-ink text-lg leading-[1.6]">
                {descriptionParagraphs.map((p, i) => (
                  <p key={i} className={i > 0 ? 'mt-4' : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatColor(color: string | undefined): string | null {
  if (!color) return null;
  switch (color) {
    case 'cheprachny':
      return 'Чепрачный';
    case 'zonarny':
      return 'Зонарный';
    case 'cherny':
      return 'Чёрный';
    default:
      return null;
  }
}
