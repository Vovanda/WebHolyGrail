'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';

import { type EngineModule, MODULES, moduleToggleKey, type ModuleKey } from 'contracts';

/**
 * Модули сайта плитками: включить и выключить одним нажатием.
 *
 * @remarks
 * Владелец думает модулями («нужен ли мне магазин»), а не записями
 * переключателей. Плитка пишет тот же флаг `module.<ключ>`, что лежит в
 * «Переключателях», и сразу во всех трёх окружениях: модуль либо есть у сайта,
 * либо нет. Тонкая настройка по окружениям остаётся на доске переключателей.
 *
 * Плитки идут в порядке меню админки. «Контент», «Медиа» и «Настройки» стоят на
 * своих местах без переключателя: они есть у любого сайта и не выключаются, но
 * владелец видит весь набор разом.
 */
interface ToggleDoc {
  id: string | number;
  key?: string;
  production?: boolean | null;
  staging?: boolean | null;
  development?: boolean | null;
}

interface CoreTile {
  readonly title: string;
  readonly description: string;
}

const CONTENT: CoreTile = {
  title: 'Контент',
  description: 'Страницы, общие секции и вопросы-ответы.',
};
const MEDIA: CoreTile = { title: 'Медиа', description: 'Файлы, видео и плейлисты.' };
const SETTINGS: CoreTile = {
  title: 'Настройки',
  description: 'Настройки сайта, переключатели, редакторы и задачи.',
};

const byKey = (key: ModuleKey): EngineModule => MODULES.find((m) => m.key === key)!;

/** Порядок меню: входящее от посетителя, содержимое, служебное ниже. */
const TILES: readonly (CoreTile | EngineModule)[] = [
  CONTENT,
  byKey('forms'),
  byKey('shop'),
  byKey('blog'),
  MEDIA,
  byKey('access'),
  byKey('specialists'),
  byKey('social'),
  SETTINGS,
];

const isOn = (doc: ToggleDoc | undefined): boolean =>
  doc ? doc.production === true || doc.staging === true || doc.development === true : true;

const tileStyle = {
  aspectRatio: '1',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  textAlign: 'left',
  padding: '1.25rem',
  // Углы как у остальной админки: она их не скругляет.
  borderRadius: 0,
  color: 'var(--theme-text)',
} as const;

function TileText({ title, description, status }: CoreTile & { status: ReactNode }) {
  return (
    <>
      <span>
        <span style={{ display: 'block', fontWeight: 600, fontSize: '1.6rem' }}>{title}</span>
        <span style={{ display: 'block', marginTop: '.75rem', fontSize: '1.05rem', opacity: 0.75 }}>
          {description}
        </span>
      </span>
      <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{status}</span>
    </>
  );
}

export function ModulesBoard() {
  const [docs, setDocs] = useState<Record<string, ToggleDoc> | null>(null);
  const [busy, setBusy] = useState<ModuleKey | null>(null);
  const router = useRouter();

  useEffect(() => {
    void fetch('/api/feature-toggles?depth=0&limit=200&where[key][like]=module.', {
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { docs?: ToggleDoc[] } | null) =>
        setDocs(Object.fromEntries((d?.docs ?? []).map((doc) => [doc.key ?? '', doc]))),
      )
      .catch(() => setDocs({}));
  }, []);

  async function flip(key: ModuleKey) {
    const doc = docs?.[moduleToggleKey(key)];
    if (!doc) return;
    const next = !isOn(doc);
    setBusy(key);
    const response = await fetch(`/api/feature-toggles/${doc.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ production: next, staging: next, development: next }),
    }).catch(() => null);
    setBusy(null);
    if (!response?.ok) return;
    setDocs((current) => ({
      ...current,
      [moduleToggleKey(key)]: { ...doc, production: next, staging: next, development: next },
    }));
    // Меню админки собирает сервер: без обновления разделы модуля исчезли бы
    // только после перехода на другую страницу.
    router.refresh();
  }

  if (docs === null) return <p style={{ opacity: 0.7 }}>Читаем модули…</p>;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{ margin: '0 0 1rem', opacity: 0.7, fontSize: '.85rem' }}>
        Выключенный модуль скрыт в админке, его страницы на сайте отвечают «не найдено», блоки
        нельзя поставить. Данные остаются: включите - и всё вернётся.
      </p>
      <div
        style={{
          display: 'grid',
          // Три плитки в ряд; на узком экране они сжимаются, а не уходят вниз.
          gridTemplateColumns: 'repeat(3, minmax(0, 15rem))',
          gap: '1rem',
        }}
      >
        {TILES.map((tile) => {
          if (!('key' in tile)) {
            return (
              <div
                key={tile.title}
                style={{
                  ...tileStyle,
                  border: '1px solid var(--theme-elevation-150)',
                  background: 'var(--theme-elevation-50)',
                }}
              >
                <TileText
                  {...tile}
                  status={<span style={{ opacity: 0.75 }}>Всегда включён</span>}
                />
              </div>
            );
          }
          const doc = docs[moduleToggleKey(tile.key)];
          const on = isOn(doc);
          return (
            <button
              key={tile.key}
              type="button"
              aria-pressed={on}
              disabled={!doc || busy === tile.key}
              onClick={() => void flip(tile.key)}
              style={{
                ...tileStyle,
                border: `1px solid ${on ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
                background: on ? 'var(--theme-success-50)' : 'var(--theme-elevation-50)',
                cursor: doc ? 'pointer' : 'default',
                opacity: busy === tile.key ? 0.5 : 1,
              }}
            >
              <TileText
                {...tile}
                status={doc ? (on ? 'Включён' : 'Выключен') : 'Появится после перезапуска'}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
