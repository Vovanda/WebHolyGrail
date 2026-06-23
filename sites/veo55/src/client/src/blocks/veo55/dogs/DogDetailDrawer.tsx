'use client';

import { useEffect, useState } from 'react';

import type { DogDoc } from '@veo55/contracts';
import { cn } from '@/lib/utils';
import { resolveMediaUrl, resolveMediaAlt } from '@/blocks/veo55/litter/_shared';

import { DetailDrawer, openDetail } from '@/blocks/primitives/DetailDrawer';

/**
 * DogDetailDrawerRoot — глобальный root который слушает hash `#d=dog:<slug>` и
 * показывает модалку-карточку собаки.
 *
 * Один экземпляр на странице (вставлен в SiteLayout / RootLayout). Клик на
 * кличку (`<DogChip slug={...}/>` или похожий триггер) делает
 * `openDetail(\`dog:\${slug}\`)` — компонент перехватывает hash и тянет
 * данные собаки через REST API `/api/dogs?where[slug]=...`.
 *
 * Контент: hero-фото (лайтбокс не нужен — внутри модалки), name + nameLat,
 * регалии (titles), краткое описание, кнопка «Подробнее → /dog/<slug>».
 */
export function DogDetailDrawerRoot() {
  const [slug, setSlug] = useState<string | null>(null);
  const [dog, setDog] = useState<DogDoc | null>(null);
  const [loading, setLoading] = useState(false);

  // Слушаем hash → берём slug из `#d=dog:<slug>`.
  useEffect(() => {
    function check() {
      // `:` в hash может быть закодировано как `%3A` (после encodeURIComponent
      // в openDetail). Принимаем оба варианта.
      const m = window.location.hash.match(/^#d=dog(?::|%3A)([^&]+)/i);
      const next = m ? decodeURIComponent(m[1] ?? '') : null;
      setSlug(next);
    }
    check();
    window.addEventListener('hashchange', check);
    window.addEventListener('popstate', check);
    return () => {
      window.removeEventListener('hashchange', check);
      window.removeEventListener('popstate', check);
    };
  }, []);

  // Глобальный click-перехватчик: любой <a data-detail-dialog="<slug>">
  // открывает модалку, а не уходит на /dog/<slug>. Контент полной страницы
  // остаётся для шаринга / SEO — кнопка «Подробнее →» в модалке туда ведёт.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Игнорируем модификаторы (Ctrl/⌘+клик = открыть в новой вкладке).
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-detail-dialog]');
      if (!target) return;
      const dogSlug = target.dataset.detailDialog;
      if (!dogSlug) return;
      e.preventDefault();
      openDetail(`dog:${dogSlug}`);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // На смену slug — fetch собаки через REST.
  useEffect(() => {
    if (!slug) {
      setDog(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    // Same-origin proxy — Chrome Private Network Access блокирует прямой fetch
    // к http://localhost:3001 со страниц https://veo.sawking.tech (demo-tunnel),
    // показывая системный попап «доступ к локальной сети». /internal/dog/<slug>
    // на Next-сервере делает fetch к CMS server-side. Namespace /internal/*
    // отдельный от /api/* — local-nginx маршрутит /api в Payload, не в Next.
    const url = `/internal/dog/${encodeURIComponent(slug)}`;
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: DogDoc | null) => {
        if (cancelled) return;
        setDog(data);
      })
      .catch(() => {
        if (cancelled) return;
        setDog(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) return null;

  return (
    <DetailDrawer slug={`dog:${slug}`}>
      <DogDetailBody slug={slug} dog={dog} loading={loading} />
    </DetailDrawer>
  );
}

function DogDetailBody({
  slug,
  dog,
  loading,
}: {
  readonly slug: string;
  readonly dog: DogDoc | null;
  readonly loading: boolean;
}) {
  if (loading && !dog) {
    return (
      <div className="px-8 pt-20 pb-10 text-center text-muted font-display italic">Загрузка…</div>
    );
  }
  if (!dog) {
    return (
      <div className="px-8 pt-20 pb-10 text-center text-muted font-display italic">
        Собака не найдена
      </div>
    );
  }
  const photo = dog.photos?.[0]?.image;
  const photoUrl = resolveMediaUrl(photo);
  const photoAlt = resolveMediaAlt(photo) ?? dog.name;
  const titles = dog.titles ?? [];

  return (
    <div className="pb-10">
      {photoUrl ? (
        <div className="relative w-full aspect-[4/5] bg-[#F3EFE7]">
          <img
            src={photoUrl}
            alt={photoAlt}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/5] bg-[#F3EFE7] flex items-center justify-center text-muted font-display italic">
          Фото скоро
        </div>
      )}

      <div className="px-6 md:px-8 pt-6">
        <h2 className="font-display text-[22px] md:text-2xl font-bold text-ink uppercase tracking-[0.3px] leading-tight">
          {dog.name}
        </h2>
        {dog.sex && (
          <p className="mt-1 text-muted text-[13px]">
            {dog.sex === 'male' ? 'Кобель' : 'Сука'}
            {dog.dob && ` · ${new Date(dog.dob).getFullYear()}`}
          </p>
        )}

        {titles.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {titles.map((t, i) => (
              <li
                key={i}
                className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full',
                  'bg-accent-soft text-accent-dark text-[12px] font-semibold',
                )}
              >
                {t.text}
                {t.year ? ` · ${t.year}` : ''}
              </li>
            ))}
          </ul>
        )}

        <a
          href={`/dog/${slug}`}
          className={cn(
            'mt-6 inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5',
            'bg-accent text-paper rounded-full font-bold text-[14px] no-underline',
            'transition-colors hover:bg-accent-dark',
          )}
        >
          Подробнее →
        </a>
      </div>
    </div>
  );
}
