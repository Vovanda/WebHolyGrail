import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getSiteSettings, getSpecialistBySlug, type SpecialistDoc } from '@/lib/api-client';
import { renderBlockNode } from '@/layouts/site-layout';
import { resolveMediaUrl } from '@/lib/media';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { RatingStars } from '@/blocks/primitives/RatingStars';

/**
 * /specialists/[slug] — личная страница специалиста. SSR (R14).
 *
 * @remarks
 * Страница работает в двух режимах. Если человек собрал себе блоки — рендерим
 * их, как обычную страницу: у каждого своя подача. Если нет — показываем
 * профиль из полей карточки, чтобы страница существовала и была полезной с
 * первой минуты, ещё до того как кто-то занялся вёрсткой.
 */
type Params = { slug: string };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getSpecialistBySlug(slug);
  if (!doc) return { title: 'Страница не найдена' };

  // Заполненная секция SEO главнее профиля: владелец страницы решает, каким
  // она уходит в поиск и в мессенджеры. Пусто — собираем из того, что уже есть.
  const title = doc.seo?.title ?? doc.fullName;
  const description = doc.seo?.description ?? doc.headline ?? doc.bio?.slice(0, 160);
  // Ссылкой на человека делятся в мессенджерах, и в превью должен быть он,
  // а не логотип сайта: по логотипу все страницы выглядят одинаково.
  const image = resolveMediaUrl(doc.seo?.ogImage) ?? photoUrl(doc);

  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: `/specialists/${slug}` },
    ...(doc.seo?.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'profile',
      title,
      ...(description ? { description } : {}),
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    ...(image ? { twitter: { card: 'summary_large_image' as const, images: [image] } } : {}),
  };
}

/**
 * Разметка Person для поисковика: имя, фото, направления, город и ссылки на
 * профили. Без неё карточка человека для робота — обычный текст.
 */
function personJsonLd(doc: SpecialistDoc, slug: string): string {
  const photo = photoUrl(doc);
  const city =
    typeof doc.city === 'object' && doc.city ? (doc.city as { name?: string }).name : undefined;
  const links = Object.values(doc.contacts ?? {}).filter(
    (v): v is string => typeof v === 'string' && v.startsWith('http'),
  );
  const disciplines = (doc.disciplines ?? []).map((d) => d.title).filter(Boolean);

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: doc.fullName,
    url: `/specialists/${slug}`,
    ...(doc.headline ? { jobTitle: doc.headline } : {}),
    ...(doc.bio ? { description: doc.bio.slice(0, 500) } : {}),
    ...(photo ? { image: photo } : {}),
    ...(city ? { address: { '@type': 'PostalAddress', addressLocality: city } } : {}),
    ...(disciplines.length > 0 ? { knowsAbout: disciplines } : {}),
    ...(links.length > 0 ? { sameAs: links } : {}),
    ...(doc.contacts?.email ? { email: doc.contacts.email } : {}),
    ...(doc.contacts?.phone ? { telephone: doc.contacts.phone } : {}),
  });
}

function photoUrl(doc: SpecialistDoc): string | undefined {
  const photo = doc.photo;
  if (!photo || typeof photo !== 'object') return undefined;
  return (photo as { url?: string }).url;
}

/** Контакты показываем ссылками: с телефона в них тыкают, а не переписывают. */
function contactHref(kind: string, value: string): string {
  const bare = value.replace(/^@/, '');
  switch (kind) {
    case 'phone':
      return `tel:${value.replace(/[^\d+]/g, '')}`;
    case 'email':
      return `mailto:${value}`;
    case 'telegram':
      return value.startsWith('http') ? value : `https://t.me/${bare}`;
    case 'whatsapp':
      return value.startsWith('http') ? value : `https://wa.me/${value.replace(/[^\d]/g, '')}`;
    default:
      return value;
  }
}

const CONTACT_LABEL: Record<string, string> = {
  phone: 'Телефон',
  email: 'Почта',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  vk: 'ВКонтакте',
  youtube: 'YouTube',
};

/**
 * Профиль: рассказ о себе, регалии, факты, адреса.
 *
 * @remarks
 * Показывается в обоих режимах страницы. Эти поля человек заполняет в своей
 * карточке, и если собрать страницу блоками, они молча пропадали: заполнил «О
 * себе» — на сайте пусто, без единого намёка почему.
 *
 * Каждая секция рисуется только когда заполнена, поэтому у того, кто рассказал
 * о себе прямо в блоках, ничего не задвоится.
 */
function ProfileSections({ doc }: { readonly doc: SpecialistDoc }) {
  const credentials = doc.credentials ?? [];
  const facts = doc.facts ?? [];
  const locations = doc.locations ?? [];
  if (!doc.bio && credentials.length === 0 && facts.length === 0 && locations.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-content px-4 md:px-6">
      {doc.bio && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">О себе</h2>
          {doc.bio.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-ink/90">
              {paragraph}
            </p>
          ))}
        </section>
      )}

      {credentials.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Образование и регалии</h2>
          <ul className="mt-3 space-y-2">
            {credentials.map((item) => (
              <li key={item.title} className="text-ink/90">
                {item.title}
                {item.note && <span className="text-muted"> — {item.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {facts.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Факты</h2>
          <ul className="mt-3 space-y-2">
            {facts.map((item) => (
              <li key={item.text} className="text-ink/90">
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {locations.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Где найти</h2>
          <ul className="mt-3 space-y-3">
            {locations.map((place) => (
              <li key={place.title} className="rounded-lg border border-border p-4">
                <p className="font-medium text-ink">{place.title}</p>
                {place.address && <p className="text-muted">{place.address}</p>}
                {place.note && <p className="text-sm text-muted">{place.note}</p>}
                {place.mapUrl && (
                  <a
                    href={place.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-accent underline-offset-2 hover:underline"
                  >
                    Посмотреть на карте
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Контакты специалиста. Показываются в обоих режимах страницы: человек, который
 * долистал до конца, должен иметь возможность написать напрямую — даже если
 * страница собрана блоками и заканчивается формой.
 */
function Contacts({ doc }: { readonly doc: SpecialistDoc }) {
  const contacts = Object.entries(doc.contacts ?? {}).filter(([, v]) => Boolean(v)) as Array<
    [string, string]
  >;
  if (contacts.length === 0) return null;

  return (
    <section className="mx-auto max-w-content px-4 py-10 md:px-6">
      <h2 className="font-display text-xl font-semibold text-ink">Связаться</h2>
      <ul className="mt-3 flex flex-wrap gap-3">
        {contacts.map(([kind, value]) => (
          <li key={kind}>
            <a
              href={contactHref(kind, value)}
              className="inline-block rounded-md border border-accent px-4 py-2 text-accent transition-colors hover:bg-accent hover:text-accent-fg"
              {...(contactHref(kind, value).startsWith('http')
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {CONTACT_LABEL[kind] ?? kind}: {value}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SpecialistPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [doc, settings] = await Promise.all([getSpecialistBySlug(slug), getSiteSettings()]);
  if (!doc) notFound();

  const blocks = doc.blocks ?? [];
  if (blocks.length > 0 && settings) {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: personJsonLd(doc, slug) }}
        />
        <div className="mx-auto max-w-wide px-4 md:px-6">
          <Breadcrumbs
            copyLink
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Эксперты', href: '/specialists' },
              { label: doc.fullName },
            ]}
          />
        </div>
        {blocks.map((block, index) => {
          // Payload отдаёт поля блока на верхнем уровне, а рендер ждёт их в
          // `data` — без этой обёртки компоненты видят пустые пропсы и
          // показывают одни значения по умолчанию.
          const raw = block as { blockType: string; id?: string };
          return (
            <div key={raw.id ?? `${slug}-${index}`}>
              {renderBlockNode(
                {
                  blockType: raw.blockType,
                  id: raw.id ?? `${slug}-${index}`,
                  data: raw as unknown as Record<string, unknown>,
                },
                settings,
              )}
            </div>
          );
        })}
        <ProfileSections doc={doc} />
        <Contacts doc={doc} />
      </>
    );
  }

  const photo = photoUrl(doc);
  const disciplines = (doc.disciplines ?? []).map((d) => d.title).filter(Boolean);
  return (
    <article className="mx-auto max-w-content px-4 pb-10 md:px-6 md:pb-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personJsonLd(doc, slug) }}
      />
      <Breadcrumbs
        copyLink
        items={[
          { label: 'Главная', href: '/' },
          { label: 'Эксперты', href: '/specialists' },
          { label: doc.fullName },
        ]}
      />

      <header className="flex flex-col gap-6 md:flex-row md:items-start">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- источник S3 нашей CMS
          <img src={photo} alt={doc.fullName} className="w-full rounded-xl object-cover md:w-64" />
        )}
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">
            {doc.fullName}
          </h1>
          {doc.headline && <p className="mt-2 text-lg text-muted">{doc.headline}</p>}
          {typeof doc.city === 'object' && doc.city && (
            <p className="mt-1 text-sm uppercase tracking-wide text-accent">
              {(doc.city as { name?: string }).name}
            </p>
          )}
          {doc.ratingPublic && typeof doc.rating === 'number' && doc.rating > 0 && (
            <p className="mt-2">
              <RatingStars value={doc.rating} showValue />
            </p>
          )}
        </div>
      </header>

      {disciplines.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Направления</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {disciplines.map((title) => (
              <li
                key={title}
                className="rounded-full border border-border px-3 py-1 text-sm text-ink"
              >
                {title}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Профиль вынесен наружу: те же секции показываются и когда страница
          собрана блоками. Отрицательные отступы гасят внешний контейнер —
          он свой у обоих режимов. */}
      <div className="-mx-4 md:-mx-6">
        <ProfileSections doc={doc} />
      </div>

      <Contacts doc={doc} />
    </article>
  );
}
