'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useCallback, useEffect, useState } from 'react';

import {
  copiesOf,
  copyRole,
  totalBytes,
  type Copy,
  type MediaRecord,
} from '../../lib/media-copies';
import { formatBytes } from '../../lib/bytes';

const plain = {
  background: 'none',
  border: 0,
  padding: 0,
  cursor: 'pointer',
  textDecoration: 'underline',
} as const;

/**
 * Копии файла: что лежит в хранилище и сколько весит.
 *
 * @remarks
 * Штатная кнопка «Предварительный просмотр размеров» перечень только
 * показывает. Здесь у каждой строки есть удаление: оригинал тяжелее всех
 * ступеней вместе взятых, а нужен редко, и место под него владелец
 * возвращает сам.
 *
 * Показывается только у картинок: у видео и документа копий не бывает, и пустой
 * перечень там занимал бы место зря.
 *
 * Свёрнут по умолчанию. Действие необратимое и нужное редко - когда залили
 * очень тяжёлый снимок и хотят вернуть место, - поэтому на виду ему делать
 * нечего.
 */
export function MediaCopiesField() {
  const { id } = useDocumentInfo();
  const [doc, setDoc] = useState<MediaRecord | null>(null);
  const [busy, setBusy] = useState('');
  const [failure, setFailure] = useState('');
  /*
    Удаление необратимо, поэтому идёт в два нажатия: первое спрашивает, второе
    удаляет. Системный вопрос браузера здесь не к месту - он выглядит чужим
    и закрывается вслепую.
  */
  const [asking, setAsking] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    void fetch(`/api/media/${id}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((next) => setDoc(next))
      .catch(() => undefined);
  }, [id]);

  useEffect(load, [load]);

  if (!doc) return null;
  if (!doc.mimeType?.startsWith('image/')) return null;
  const copies = copiesOf(doc);
  if (copies.length < 2) return null;

  const drop = async (copy: Copy) => {
    setBusy(copy.filename);
    setAsking('');
    setFailure('');
    try {
      const answer = await fetch(`/api/media/${id}/copies/${copy.step || 'original'}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!answer.ok) {
        const body = (await answer.json().catch(() => null)) as { error?: string } | null;
        setFailure(body?.error ?? 'Удалить копию не вышло');
        return;
      }
      load();
    } finally {
      setBusy('');
    }
  };

  return (
    <details style={{ marginBottom: 24 }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, marginBottom: 8 }}>
        <strong>Копии файла</strong>{' '}
        <span style={{ fontSize: 12, opacity: 0.7 }}>всего {formatBytes(totalBytes(doc))}</span>
      </summary>

      <div style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 6 }}>
        {copies.map((copy, at) => (
          <div
            key={copy.filename}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 12px',
              fontSize: 13,
              borderTop: at === 0 ? undefined : '1px solid var(--theme-elevation-100)',
            }}
          >
            <span style={{ minWidth: 104 }}>
              {copy.height ? `${copy.width} × ${copy.height}` : `${copy.width} точек`}
            </span>
            <span style={{ opacity: 0.7 }}>{copyRole(copy).name}</span>
            <span style={{ marginLeft: 'auto', opacity: 0.7 }}>{formatBytes(copy.bytes)}</span>
            {asking === copy.filename ? (
              <>
                <span style={{ opacity: 0.7 }}>Удалить насовсем?</span>
                <button
                  type="button"
                  onClick={() => void drop(copy)}
                  disabled={busy !== ''}
                  style={{ ...plain, color: 'var(--theme-error-500)' }}
                >
                  {busy === copy.filename ? 'удаляю…' : 'да'}
                </button>
                <button type="button" onClick={() => setAsking('')} style={plain}>
                  нет
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAsking(copy.filename)}
                disabled={busy !== ''}
                style={plain}
              >
                {copyRole(copy).removeLabel}
              </button>
            )}
          </div>
        ))}
      </div>

      {failure && (
        <p style={{ marginTop: 8, fontSize: 12, color: 'var(--theme-error-500)' }}>{failure}</p>
      )}
      <p style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
        {doc.originalDropped
          ? 'Исходник удалён. Самым крупным файлом записи служит копия; удаление любой из них тоже необратимо.'
          : 'Удалили оригинал - его место занимает самая крупная из оставшихся копий. Файл из хранилища удаляется насовсем.'}
      </p>
    </details>
  );
}
