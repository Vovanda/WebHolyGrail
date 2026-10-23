'use client';

import { Button, usePreferences } from '@payloadcms/ui';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { type EngineModule, MODULES, moduleToggleKey, type ModuleKey } from 'contracts';

import { NAV_ORDER_PREFERENCE } from '../../lib/admin-nav/arrange';
import { setModuleOn, setNavOrder } from '../navState';

/**
 * Модули сайта плитками: включить и выключить одним нажатием.
 *
 * @remarks
 * Владелец думает модулями («нужен ли мне магазин»), а не записями
 * переключателей. Плитка пишет тот же флаг `module.<ключ>`, что лежит в
 * «Переключателях», и сразу во всех трёх окружениях: модуль либо есть у сайта,
 * либо нет. Тонкая настройка по окружениям остаётся на доске переключателей.
 *
 * Плитки идут в порядке меню админки, и порядок меняется перетаскиванием: он
 * хранится в настройках пользователя, меню перестраивается сразу. «Контент»,
 * «Медиа» и «Настройки» без переключателя: они есть у любого сайта и не
 * выключаются, но владелец видит весь набор разом и ставит их куда хочет.
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

/** Порядок по умолчанию: основа сайта, входящее от посетителя, служебное ниже. */
const TILES: readonly (CoreTile | EngineModule)[] = [
  CONTENT,
  MEDIA,
  byKey('forms'),
  byKey('shop'),
  byKey('blog'),
  byKey('access'),
  byKey('specialists'),
  byKey('social'),
  SETTINGS,
];

/** Плитки в порядке пользователя; плитки вне сохранённого порядка - на своих местах в конце. */
function inOrder(order: readonly string[]): (CoreTile | EngineModule)[] {
  const rank = (title: string) => {
    const at = order.indexOf(title);
    return at === -1 ? Number.MAX_SAFE_INTEGER : at;
  };
  return TILES.map((tile, index) => ({ tile, index }))
    .sort((a, b) => rank(a.tile.title) - rank(b.tile.title) || a.index - b.index)
    .map(({ tile }) => tile);
}

/** Список с элементом, перенесённым с места `from` на место `to`. */
function moved<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

const isOn = (doc: ToggleDoc | undefined): boolean =>
  doc ? doc.production === true || doc.staging === true || doc.development === true : true;

const tileStyle = {
  position: 'relative',
  width: '100%',
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
  const [tiles, setTiles] = useState(TILES);
  const [dragging, setDragging] = useState<string | null>(null);
  const before = useRef<string[]>([]);
  const { getPreference, setPreference } = usePreferences();
  const router = useRouter();

  useEffect(() => {
    void getPreference<string[] | null>(NAV_ORDER_PREFERENCE)
      .then((order) => Array.isArray(order) && setTiles(inOrder(order)))
      .catch(() => undefined);
  }, [getPreference]);

  /*
    Плитки переставляются по ходу: несомая встаёт на место той, над которой
    курсор, соседи сдвигаются, а на её месте пустая ячейка с рамкой - видно, куда
    она ляжет. Сохраняется порядок, когда плитку отпустили.
  */
  function enter(target: string) {
    if (!dragging || dragging === target) return;
    setTiles((current) => {
      const titles = current.map((tile) => tile.title);
      return moved(current, titles.indexOf(dragging), titles.indexOf(target));
    });
  }

  function release() {
    setDragging(null);
    const titles = tiles.map((tile) => tile.title);
    if (titles.join() === before.current.join()) return;
    setNavOrder(titles);
    void setPreference(NAV_ORDER_PREFERENCE, titles).catch(() => undefined);
  }

  function resetOrder() {
    setTiles(TILES);
    setNavOrder([]);
    void setPreference(NAV_ORDER_PREFERENCE, []).catch(() => undefined);
  }

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
    // Пока ответ не пришёл, второе нажатие ждёт: два запроса вразнобой оставили
    // бы в базе одно значение, а на плитке другое.
    if (!doc || busy) return;
    const next = !isOn(doc);
    const apply = (value: boolean) =>
      setDocs((current) => ({
        ...current,
        [moduleToggleKey(key)]: { ...doc, production: value, staging: value, development: value },
      }));
    // Плитка переключается сразу, а не после ответа: иначе нажатие выглядит
    // пропущенным, и его повторяют - модуль возвращается обратно.
    apply(next);
    setModuleOn(key, next);
    setBusy(key);
    const response = await fetch(`/api/feature-toggles/${doc.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ production: next, staging: next, development: next }),
    }).catch(() => null);
    setBusy(null);
    if (!response?.ok) {
      apply(!next);
      return setModuleOn(key, !next);
    }
    // Меню уже перестроилось по отметке; перерисовка приносит настоящие права
    // к разделам модуля, а снимок сервера сменяет отметку.
    router.refresh();
  }

  if (docs === null) return <p style={{ opacity: 0.7 }}>Читаем модули…</p>;
  const loaded = docs;

  function renderTile(tile: CoreTile | EngineModule, index: number): ReactNode {
    const place = (
      <span style={{ position: 'absolute', top: '.6rem', right: '.75rem', opacity: 0.5 }}>
        {index + 1}
      </span>
    );
    let body: ReactNode;
    if (!('key' in tile)) {
      body = (
        <div
          style={{
            ...tileStyle,
            border: '1px solid var(--theme-elevation-150)',
            background: 'var(--theme-elevation-50)',
          }}
        >
          {place}
          <TileText
            title={tile.title}
            description={tile.description}
            status={<span style={{ opacity: 0.75 }}>Всегда включён</span>}
          />
        </div>
      );
    } else {
      const doc = loaded[moduleToggleKey(tile.key)];
      const on = isOn(doc);
      const key = tile.key;
      body = (
        <button
          type="button"
          aria-pressed={on}
          disabled={!doc}
          onClick={() => void flip(key)}
          style={{
            ...tileStyle,
            border: `1px solid ${on ? 'var(--theme-success-500)' : 'var(--theme-elevation-150)'}`,
            background: on ? 'var(--theme-success-50)' : 'var(--theme-elevation-50)',
            cursor: busy === key ? 'progress' : doc ? 'pointer' : 'default',
          }}
        >
          {place}
          <TileText
            title={tile.title}
            description={tile.description}
            status={doc ? (on ? 'Включён' : 'Выключен') : 'Появится после перезапуска'}
          />
        </button>
      );
    }
    return body;
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <p style={{ margin: '0 0 1rem', opacity: 0.7, fontSize: '.85rem' }}>
        Выключенный модуль скрыт в админке, его страницы на сайте отвечают «не найдено», блоки
        нельзя поставить. Данные остаются: включите - и всё вернётся. Порядок плиток - порядок
        разделов в меню: перетащите плитку на нужное место.
      </p>
      <Button buttonStyle="secondary" size="small" onClick={resetOrder}>
        Порядок по умолчанию
      </Button>
      <div
        style={{
          display: 'grid',
          // Три плитки в ряд; на узком экране они сжимаются, а не уходят вниз.
          gridTemplateColumns: 'repeat(3, minmax(0, 15rem))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {tiles.map((tile, index) => (
          <div
            key={tile.title}
            draggable
            title="Перетащите, чтобы поменять место раздела в меню"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', tile.title);
              before.current = tiles.map((item) => item.title);
              setDragging(tile.title);
            }}
            onDragEnter={() => enter(tile.title)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => event.preventDefault()}
            onDragEnd={release}
            style={{ cursor: 'grab' }}
          >
            {dragging === tile.title ? (
              <div
                style={{
                  aspectRatio: '1',
                  border: '2px dashed var(--theme-success-500)',
                  background: 'var(--theme-success-50)',
                }}
              />
            ) : (
              renderTile(tile, index)
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
