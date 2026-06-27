'use client';

import { useField } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';

/**
 * ColorField — custom field-component для hex-цвета. Показывает native
 * `<input type="color">` swatch рядом с text-input, синхронизирует значения.
 * Используется в SiteSettings palette-полях.
 */
const ColorField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path: path ?? field.name });
  const hex = typeof value === 'string' ? value : '';
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#cccccc';
  const placeholder = (field.admin?.placeholder as string | undefined) ?? '#000000';

  return (
    <div className="field-type text" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, color: 'var(--theme-elevation-700)' }}>
        {field.label as string}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={safeHex}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: 36,
            height: 36,
            padding: 0,
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
            background: 'transparent',
            cursor: 'pointer',
          }}
          aria-label={`${field.label as string} — color picker`}
        />
        <input
          type="text"
          value={hex}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          pattern="^#[0-9a-fA-F]{6}$"
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
            fontFamily: 'monospace',
            fontSize: 14,
          }}
        />
      </div>
      {field.admin?.description && (
        <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          {field.admin.description as string}
        </div>
      )}
    </div>
  );
};

export default ColorField;
