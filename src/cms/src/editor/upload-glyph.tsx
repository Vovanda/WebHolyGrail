'use client';

import { useToolbarIcon } from './toolbar-icon';

/** Значок штатной загрузки из «+» - им помечено вложение, которое её заменяет. */
export function UploadGlyph() {
  const Icon = useToolbarIcon('add', 'upload');
  return Icon ? <Icon /> : null;
}
