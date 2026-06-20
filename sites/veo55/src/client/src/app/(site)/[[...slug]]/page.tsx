import { notFound } from 'next/navigation';
import type { BlockNode, LitterDoc } from '@veo55/contracts';

import {
  getLitterByDobLetter,
  getPageBySlug,
  getSiteSettings,
  listDogs,
  listLittersInRange,
} from '@/lib/api-client';
import { FALLBACK_SITE_SETTINGS } from '@/layouts/presets/fallback-site-settings';
import { renderBlockNode } from '@/layouts/site-layout';
import { LittersList } from '@/blocks/veo55/litter/LittersList';
import { DogsList } from '@/blocks/veo55/dogs/DogsList';

/**
 * Catchall публичный маршрут — рендерит любую страницу из Payload Pages по slug.
 *
 * @remarks
 * - `/` → slug = `''` (главная)
 * - `/about` → slug = `'about'`
 * - `/contacts/visit` → slug = `'contacts/visit'` (если нужно nested URL'ы — мама задаёт slug целиком)
 *
 * Контент **только из БД** (R0). Если страница не найдена в Pages — 404.
 * Если найдена, но `blocks` пустой — рендерим пустой `<main>` (страница есть, но не наполнена).
 */
type Params = { slug?: string[] };

/** Маппинг URL-сегментов в slug Payload-страницы. Главная (`/`) → `home`. */
function resolveSlug(segments: string[] | undefined): string {
  const path = (segments ?? []).join('/');
  return path === '' ? 'home' : path;
}

/**
 * Парсинг URL вида `/puppies[/<date>[/<letter>]]`:
 *  - `puppies` (0 segments после) → list всех помётов
 *  - `puppies/<YYYY>` → list помётов года
 *  - `puppies/<YYYY-MM>` → list помётов месяца
 *  - `puppies/<YYYY-MM-DD>` → list помётов дня
 *  - `puppies/<YYYY-MM-DD>/<letter>` → детальная страница помёта
 *
 * Возвращает `null` если URL не подходит под этот паттерн.
 */
function parsePuppiesUrl(
  segments: string[] | undefined,
):
  | { kind: 'list'; from: string | null; to: string | null }
  | { kind: 'detail'; dob: string; letter: string }
  | null {
  const seg = segments ?? [];
  if (seg.length === 0 || seg[0] !== 'puppies') return null;
  const rest = seg.slice(1);

  if (rest.length === 0) return { kind: 'list', from: null, to: null };

  if (rest.length === 1) {
    const part = rest[0]!;
    if (/^\d{4}$/.test(part)) {
      const y = Number(part);
      return { kind: 'list', from: `${y}-01-01T00:00:00.000Z`, to: `${y + 1}-01-01T00:00:00.000Z` };
    }
    if (/^\d{4}-\d{2}$/.test(part)) {
      const [y, m] = part.split('-').map(Number) as [number, number];
      const nextY = m === 12 ? y + 1 : y;
      const nextM = m === 12 ? 1 : m + 1;
      const pad = (n: number) => String(n).padStart(2, '0');
      return {
        kind: 'list',
        from: `${y}-${pad(m)}-01T00:00:00.000Z`,
        to: `${nextY}-${pad(nextM)}-01T00:00:00.000Z`,
      };
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      return {
        kind: 'list',
        from: `${part}T00:00:00.000Z`,
        to: `${part}T23:59:59.999Z`,
      };
    }
    return null;
  }

  if (rest.length === 2 && /^\d{4}-\d{2}-\d{2}$/.test(rest[0]!)) {
    return { kind: 'detail', dob: rest[0]!, letter: rest[1]! };
  }

  return null;
}

/** Дефолтный набор generic-блоков для страницы помёта без кастомной Pages. */
function genericLitterBlocks(litter: LitterDoc): BlockNode[] {
  const data = { litter: litter.id };
  return [
    { blockType: 'litter-header', id: `gen-header-${litter.id}`, data },
    { blockType: 'litter-pair-card', id: `gen-pair-${litter.id}`, data },
    {
      blockType: 'litter-puppies',
      id: `gen-puppies-${litter.id}`,
      data: { ...data, showSold: false },
    },
  ];
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = await getPageBySlug(resolveSlug(slug)).catch(() => null);
  if (page) {
    return {
      title: page.seo?.title ?? page.title,
      description: page.seo?.description,
    };
  }
  const parsed = parsePuppiesUrl(slug);
  if (parsed?.kind === 'detail') {
    const litter = await getLitterByDobLetter(parsed.dob, parsed.letter).catch(() => null);
    if (litter) return { title: litter.title };
  }
  if (parsed?.kind === 'list') return { title: 'Помёты' };
  if (isCatalogUrl(slug)) return { title: 'Наши собаки' };
  return {};
}

/**
 * Маршрут каталога собак: одиночный сегмент `/catalog` или `/dogs`.
 */
function isCatalogUrl(segments: string[] | undefined): boolean {
  const seg = segments ?? [];
  return seg.length === 1 && (seg[0] === 'catalog' || seg[0] === 'dogs');
}

export default async function CatchallPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;

  const [page, settings] = await Promise.all([
    getPageBySlug(resolveSlug(slug)).catch(() => null),
    getSiteSettings().catch(() => null),
  ]);

  const activeSettings = settings ?? FALLBACK_SITE_SETTINGS;

  // 1) Кастомная Pages-запись перебивает всё.
  if (page) {
    return (
      <>
        {page.blocks.length === 0 ? (
          <section className="py-24 text-center">
            <p className="text-muted font-display italic text-lg">
              Страница «{page.title}» создана, но блоки ещё не добавлены. Откройте админку и
              наполните её.
            </p>
          </section>
        ) : (
          page.blocks.map((block) => (
            <div key={block.id}>
              {renderBlockNode(
                {
                  blockType: block.blockType,
                  id: block.id,
                  data: block as unknown as Record<string, unknown>,
                },
                activeSettings,
              )}
            </div>
          ))
        )}
      </>
    );
  }

  // 2) URL под маршрутом `/puppies[/...]`.
  const parsed = parsePuppiesUrl(slug);
  if (parsed?.kind === 'detail') {
    const litter = await getLitterByDobLetter(parsed.dob, parsed.letter).catch(() => null);
    if (litter) {
      return (
        <>
          {genericLitterBlocks(litter).map((block) => (
            <div key={block.id}>{renderBlockNode(block, activeSettings)}</div>
          ))}
        </>
      );
    }
  } else if (parsed?.kind === 'list') {
    const litters = await listLittersInRange(parsed.from, parsed.to).catch(() => []);
    return <LittersList litters={litters} />;
  }

  // 3) Каталог собак.
  if (isCatalogUrl(slug)) {
    const dogs = await listDogs().catch(() => []);
    return <DogsList dogs={dogs} />;
  }

  notFound();
}
