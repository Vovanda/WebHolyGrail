'use client';

import { Button, Gutter } from '@payloadcms/ui';
import { useEffect, useMemo, useState } from 'react';

/**
 * Что на сайте включено - одним экраном.
 *
 * @remarks
 * Список записей отвечает на вопрос «какие есть переключатели», а владельцу
 * нужен другой: «что сейчас включено на рабочем сайте». Здесь признаки собраны
 * по фичам, а состояние видно строкой, без захода в каждую запись.
 *
 * Переключение идёт отсюда же: заходить внутрь ради одной галочки - лишний шаг
 * там, где решение принимается за секунду.
 *
 * Стоит видом списка коллекции, поэтому поиск у доски свой: по названию, ключу,
 * группе и описанию.
 */
interface Toggle {
  id: string | number;
  title?: string;
  key?: string;
  group?: string | null;
  description?: string | null;
  production?: boolean | null;
  staging?: boolean | null;
  development?: boolean | null;
  enableAt?: string | null;
  source?: string | null;
}

const ENVIRONMENTS = [
  { field: 'production', label: 'Рабочий' },
  { field: 'staging', label: 'Пробный' },
  { field: 'development', label: 'Разработка' },
] as const;

export function TogglesBoard() {
  const [items, setItems] = useState<Toggle[] | null>(null);

  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | number | null>(null);
  // Что сайт отдаёт на самом деле: у признаков из хранилища секретов значение
  // задаёт переменная, и по галочкам его не увидеть.
  const [actual, setActual] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void fetch('/api/feature-toggles?depth=0&limit=200&sort=group', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d?.docs ?? []))
      .catch(() => setItems([]));

    void fetch('/api/toggles', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setActual(d?.toggles ?? {}))
      .catch(() => undefined);
  }, []);

  // Собираем по фичам: владелец думает «что там с видео», а не перебирает
  // признаки по алфавиту.
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const found = (items ?? []).filter(
      (item) =>
        !needle ||
        [item.title, item.key, item.group, item.description].some((text) =>
          text?.toLowerCase().includes(needle),
        ),
    );
    const map = new Map<string, Toggle[]>();
    for (const item of found) {
      const key = item.group?.trim() || 'Прочее';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'ru'));
  }, [items, query]);

  async function toggle(item: Toggle, field: (typeof ENVIRONMENTS)[number]['field']) {
    setBusy(item.id);
    const next = !item[field];
    const response = await fetch(`/api/feature-toggles/${item.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ [field]: next }),
    }).catch(() => null);
    setBusy(null);
    if (!response?.ok) return;
    setItems((current) =>
      (current ?? []).map((row) => (row.id === item.id ? { ...row, [field]: next } : row)),
    );
  }

  return (
    <Gutter>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 1rem' }}>
        <h1 style={{ margin: 0 }}>Переключатели</h1>
        <Button
          el="link"
          url="/admin/collections/feature-toggles/create"
          buttonStyle="pill"
          size="small"
        >
          Создать
        </Button>
      </div>
      <p style={{ margin: '0 0 1rem', opacity: 0.7, fontSize: '.85rem' }}>
        Что включено сейчас. Галочка меняет состояние сразу, название открывает карточку.
      </p>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Искать по названию, ключу или группе"
        aria-label="Поиск переключателей"
        style={{
          width: '100%',
          maxWidth: '32rem',
          padding: '.6rem .75rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg, var(--theme-elevation-0))',
          color: 'var(--theme-text)',
        }}
      />
      {items === null ? (
        <p style={{ opacity: 0.7 }}>Читаем переключатели…</p>
      ) : items.length === 0 ? (
        <p style={{ opacity: 0.7 }}>
          Переключателей пока нет. Заведите первый - и он появится здесь вместе со своей фичей.
        </p>
      ) : groups.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Ничего не нашлось.</p>
      ) : null}
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}
      >
        {groups.map(([group, rows]) => (
          <section key={group}>
            <h3 style={{ margin: '0 0 .5rem', fontSize: '.95rem' }}>{group}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
              {rows.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    padding: '.6rem .75rem',
                    borderRadius: 8,
                    background: 'var(--theme-elevation-50)',
                    opacity: busy === item.id ? 0.5 : 1,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <a
                      href={`/admin/collections/feature-toggles/${item.id}`}
                      style={{ fontWeight: 500, color: 'inherit' }}
                    >
                      {item.title ?? item.key}
                    </a>
                    <div style={{ fontSize: '.78rem', opacity: 0.7 }}>
                      {item.key}
                      {item.enableAt &&
                        ` · включится ${new Date(item.enableAt).toLocaleString('ru')}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '.75rem', flexShrink: 0 }}>
                    {item.source === 'infisical' ? (
                      <span style={{ fontSize: '.8rem', opacity: 0.75 }}>
                        {item.key && actual[item.key] ? 'включён' : 'выключен'} переменной окружения
                      </span>
                    ) : (
                      ENVIRONMENTS.map((env) => (
                        <label
                          key={env.field}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '.3rem',
                            fontSize: '.8rem',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={item[env.field] === true}
                            onChange={() => void toggle(item, env.field)}
                            disabled={busy === item.id}
                          />
                          {env.label}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Gutter>
  );
}
