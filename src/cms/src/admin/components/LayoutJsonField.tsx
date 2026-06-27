'use client';

import { useState } from 'react';
import { useField } from '@payloadcms/ui';
import type { JSONFieldClientComponent } from 'payload';

import { CLASSIC_SITE_LAYOUT_JSON } from '../layout-default';

/**
 * LayoutJsonField — custom field для SiteSettings.layout.
 * Textarea с JSON + 3 кнопки: «Reset to default» (CLASSIC_SITE_LAYOUT),
 * «Открыть в модалке» (full-screen editor), «Закрыть».
 */
const LayoutJsonField: JSONFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<unknown>({ path: path ?? field.name });
  const [modalOpen, setModalOpen] = useState(false);

  const stringified = (() => {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  })();

  const [text, setText] = useState(stringified);

  function commit(next: string) {
    setText(next);
    if (next.trim() === '') {
      setValue(null);
      return;
    }
    try {
      setValue(JSON.parse(next));
    } catch {
      // оставляем raw-text — Payload сохранит как is, server-side можно валидировать
      setValue(next);
    }
  }

  function resetToDefault() {
    const def = JSON.stringify(CLASSIC_SITE_LAYOUT_JSON, null, 2);
    commit(def);
  }

  function clearField() {
    commit('');
  }

  return (
    <div className="field-type json" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13, color: 'var(--theme-elevation-700)' }}>
        {field.label as string}
      </label>
      <textarea
        value={text}
        onChange={(e) => commit(e.target.value)}
        rows={10}
        spellCheck={false}
        style={{
          padding: '10px 12px',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: 13,
          lineHeight: 1.5,
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
          resize: 'vertical',
          minHeight: 200,
        }}
        placeholder="Пусто — используется CLASSIC_SITE_LAYOUT из кода. Нажми «Reset to default» чтобы скопировать его сюда."
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setModalOpen(true)} style={btnSecondary}>
          Открыть в большом редакторе
        </button>
        <button type="button" onClick={resetToDefault} style={btnSecondary}>
          Reset to default
        </button>
        <button type="button" onClick={clearField} style={btnSecondary}>
          Очистить (fallback на дефолт)
        </button>
      </div>
      {field.admin?.description && (
        <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          {field.admin.description as string}
        </div>
      )}

      {modalOpen && (
        <div
          role="presentation"
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--theme-bg)',
              borderRadius: 8,
              padding: 24,
              maxWidth: 1000,
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Layout JSON — большой редактор</h3>
              <button type="button" onClick={() => setModalOpen(false)} style={btnSecondary}>
                Закрыть
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => commit(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: 4,
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                fontSize: 13,
                lineHeight: 1.55,
                background: 'var(--theme-input-bg)',
                color: 'var(--theme-text)',
                resize: 'none',
                minHeight: 500,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={resetToDefault} style={btnSecondary}>
                Reset to default
              </button>
              <button type="button" onClick={clearField} style={btnSecondary}>
                Очистить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const btnSecondary: React.CSSProperties = {
  padding: '8px 14px',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  background: 'var(--theme-elevation-50)',
  color: 'var(--theme-text)',
  fontSize: 13,
  cursor: 'pointer',
};

export default LayoutJsonField;
