'use client';

import { useField, useForm } from '@payloadcms/ui';
import type { SelectFieldClientComponent } from 'payload';

import { PALETTE_PRESETS } from '../palette-presets-data';

/**
 * PalettePresetField — custom select для SiteSettings.theme.palettePreset.
 * При выборе preset автоматически заполняет 16 polate*-полей значениями из
 * registry (8 colors × 2 themes). Выбор 'custom' оставляет существующие
 * значения нетронутыми.
 */
const PalettePresetField: SelectFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path: path ?? field.name });
  const { dispatchFields } = useForm();

  const applyPreset = (presetId: string) => {
    setValue(presetId);
    if (presetId === 'custom') return;
    const preset = PALETTE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const setColor = (
      themePath: 'paletteLight' | 'paletteDark',
      name: keyof typeof preset.light,
    ) => {
      dispatchFields({
        type: 'UPDATE',
        path: `theme.${themePath}.${name}`,
        value: preset[themePath === 'paletteLight' ? 'light' : 'dark'][name],
      });
    };
    (
      [
        'primary',
        'primaryHover',
        'foreground',
        'foregroundMuted',
        'background',
        'surface',
        'success',
        'danger',
      ] as const
    ).forEach((c) => {
      setColor('paletteLight', c);
      setColor('paletteDark', c);
    });
  };

  return (
    <div className="field-type select" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, color: 'var(--theme-elevation-700)' }}>
        {field.label as string}
      </label>
      <select
        value={value ?? 'whg-default'}
        onChange={(e) => applyPreset(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid var(--theme-elevation-150)',
          borderRadius: 4,
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-text)',
          fontSize: 14,
        }}
      >
        {PALETTE_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom (только из полей ниже)</option>
      </select>
      {field.admin?.description && (
        <div style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          {field.admin.description as string}
        </div>
      )}
    </div>
  );
};

export default PalettePresetField;
