'use client';

import { FieldLabel, useConfig, useField, useFormFields } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import { useEffect, useState } from 'react';

import { type Characteristic, cleanCharacteristics, type SpecValue } from 'contracts';

/**
 * Характеристики позиции полями её раздела каталога.
 *
 * @remarks
 * В базе значения лежат одним JSON по ключам характеристик (`specs`): новая
 * характеристика раздела не требует ни миграции, ни правки кода. Здесь этот
 * JSON показан формой - поле под каждую характеристику выбранного раздела,
 * видом по её значению: число, да или нет, строка. Значения других разделов
 * при смене раздела не стираются: вернули раздел - вернулись и значения.
 */
type Specs = Record<string, SpecValue>;

export function OfferSpecsField({ path, field }: { path: string; field?: { label?: unknown } }) {
  const { value, setValue } = useField<Specs | null>({ path });
  const section = useFormFields(([fields]) => fields['section']?.value) as
    | number
    | string
    | { id?: number | string }
    | null
    | undefined;
  const sectionId = section && typeof section === 'object' ? section.id : section;
  const { config } = useConfig();
  const [chars, setChars] = useState<Characteristic[] | null>(null);

  useEffect(() => {
    if (!sectionId) return setChars([]);
    setChars(null);
    // Раздел сменили, пока шёл ответ по прежнему: опоздавший ответ не должен подменить поля.
    let stale = false;
    const url = formatAdminURL({
      apiRoute: config.routes.api,
      path: `/catalog-sections/${sectionId}?depth=0`,
    });
    void fetch(url, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((doc: { characteristics?: unknown } | null) => {
        if (!stale) setChars(cleanCharacteristics(doc?.characteristics));
      })
      .catch(() => {
        if (!stale) setChars([]);
      });
    return () => {
      stale = true;
    };
  }, [sectionId, config.routes.api]);

  const specs: Specs = value && typeof value === 'object' ? value : {};
  const put = (key: string, next: SpecValue) => {
    const copy = { ...specs };
    if (next === null || next === '') delete copy[key];
    else copy[key] = next;
    setValue(copy);
  };

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <FieldLabel label={(field?.label as string) ?? 'Характеристики'} path={path} />
      {!sectionId ? (
        <p style={{ opacity: 0.7, margin: 0 }}>
          Выберите раздел каталога - появятся его характеристики.
        </p>
      ) : chars === null ? (
        <p style={{ opacity: 0.7, margin: 0 }}>Читаем характеристики раздела…</p>
      ) : chars.length === 0 ? (
        <p style={{ opacity: 0.7, margin: 0 }}>У раздела пока нет характеристик.</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
            gap: '.75rem 1rem',
          }}
        >
          {chars.map((c) => {
            const current = specs[c.key];
            const label = c.unit ? `${c.title}, ${c.unit}` : c.title;
            return (
              <label key={c.key} style={{ display: 'grid', gap: '.3rem', fontSize: '.85rem' }}>
                <span>{label}</span>
                {c.kind === 'bool' ? (
                  <select
                    value={current === true ? 'yes' : current === false ? 'no' : ''}
                    onChange={(e) =>
                      put(c.key, e.target.value === '' ? null : e.target.value === 'yes')
                    }
                    style={inputStyle}
                  >
                    <option value="">не указано</option>
                    <option value="yes">да</option>
                    <option value="no">нет</option>
                  </select>
                ) : (
                  <input
                    type={c.kind === 'number' ? 'number' : 'text'}
                    step="any"
                    value={current === null || current === undefined ? '' : String(current)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (c.kind !== 'number') return put(c.key, raw.trim() ? raw : null);
                      // type=number отдаёт строку с точкой или пустую, если введено не число
                      const n = Number(raw);
                      put(c.key, raw.trim() && Number.isFinite(n) ? n : null);
                    }}
                    style={inputStyle}
                  />
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: '.5rem .6rem',
  border: '1px solid var(--theme-elevation-150)',
  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  borderRadius: 4,
} as const;
