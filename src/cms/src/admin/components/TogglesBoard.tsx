'use client';

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
}

const ENVIRONMENTS = [
  { field: 'production', label: 'Рабочий' },
  { field: 'staging', label: 'Пробный' },
  { field: 'development', label: 'Разработка' },
] as const;

export function TogglesBoard() {
  const [items, setItems] = useState<Toggle[] | null>(null);
  const [busy, setBusy] = useState<string | number | null>(null);

  useEffect(() => {
    void fetch('/api/feature-toggles?depth=0&limit=200&sort=group', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setItems(d?.docs ?? []))
      .catch(() => setItems([]));
  }, []);

  // Собираем по фичам: владелец думает «что там с видео», а не перебирает
  // признаки по алфавиту.
  const groups = useMemo(() => {
    const map = new Map<string, Toggle[]>();
    for (const item of items ?? []) {
      const key = item.group?.trim() || 'Без фичи';
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'ru'));
  }, [items]);

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

  if (items === null) return <p style={{ opacity: 0.7 }}>Читаем переключатели…</p>;
  if (items.length === 0) {
    return (
      <p style={{ opacity: 0.7 }}>
        Переключателей пока нет. Заведите первый - и он появится здесь вместе со своей фичей.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      <div>
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Что включено сейчас</h2>
        <p style={{ margin: '.25rem 0 0', opacity: 0.7, fontSize: '.85rem' }}>
          Галочка меняет состояние сразу, а список ниже нужен, когда переключатель заводят или
          настраивают подробно.
        </p>
      </div>

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
                  <div style={{ fontWeight: 500 }}>{item.title ?? item.key}</div>
                  <div style={{ fontSize: '.78rem', opacity: 0.7 }}>
                    {item.key}
                    {item.enableAt &&
                      ` · включится ${new Date(item.enableAt).toLocaleString('ru')}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '.75rem', flexShrink: 0 }}>
                  {ENVIRONMENTS.map((env) => (
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
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
