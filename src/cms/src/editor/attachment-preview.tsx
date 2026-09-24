'use client';

import { useBlockComponentContext } from '@payloadcms/richtext-lexical/client';
import { useConfig, useFormFields } from '@payloadcms/ui';
import { useEffect, useRef, useState } from 'react';

import {
  documentsPreview,
  galleryPreview,
  recordingPreview,
  relationKey,
  relationKeys,
  rowValues,
  type AttachmentPreview,
  type LoadedCards,
  type MediaCard,
} from './attachment-preview-model';

/*
  Вложения в тексте статьи показаны тем, что увидит читатель.

  Полная форма блока - файл, название, вид, «Вид блока» - превращала статью
  с тремя вложениями в анкету, и текст терялся между формами. Здесь в тексте
  стоит превью, а поля открывает штатная кнопка «Изменить» в панели сбоку:
  сохраняются они так же, как раньше.

  Каждый блок получает свой вид; счёт превью живёт в
  `attachment-preview-model.ts`, здесь только чтение полей и разметка.
*/

/**
 * Документы медиатеки по номерам, одним запросом.
 *
 * @remarks
 * Номера берутся из полей блока, а адреса кадров и веса есть только
 * у документов. Пока ответа нет - `null`: превью показывает загрузку,
 * а шапка блока с кнопками видна сразу. Сбой сети оставляет загрузку:
 * выдавать его за удалённый файл нельзя.
 */
function useMediaCards(keys: readonly string[]): LoadedCards {
  const { config } = useConfig();
  const [cards, setCards] = useState<LoadedCards>(null);
  const api = `${config.serverURL}${config.routes.api}`;
  const joined = keys.join(',');

  useEffect(() => {
    setCards(null);
    if (!joined) return;
    const controller = new AbortController();
    const query = new URLSearchParams({
      'where[id][in]': joined,
      depth: '0',
      limit: String(joined.split(',').length),
    });
    fetch(`${api}/media?${query.toString()}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { docs?: MediaCard[] } | null) => {
        if (body?.docs) setCards(body.docs);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [api, joined]);

  return cards;
}

/**
 * Кадр записи; не пришёл - ровная плашка той же формы.
 *
 * @remarks
 * Кадр лежит в хранилище, и оно бывает недоступно. Сломанная картинка
 * читается как сломанная запись, а плашка - как запись без кадра.
 */
function Poster({ src }: { readonly src: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="whg-attach-preview__poster" />;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- кадр записи в админке
    <img src={src} alt="" className="whg-attach-preview__poster" onError={() => setFailed(true)} />
  );
}

function PreviewView({ preview }: { readonly preview: AttachmentPreview }) {
  if (preview.kind === 'frames') {
    return (
      <div
        className={`whg-attach-preview whg-attach-preview--frames whg-attach-preview--${preview.layout}`}
      >
        {preview.frames.map((frame) => {
          const ratio = frame.aspect ? frame.aspect.width / frame.aspect.height : 1;
          return (
            // eslint-disable-next-line @next/next/no-img-element -- превью в админке, ступени не нужны
            <img
              key={frame.id}
              src={frame.src}
              alt=""
              className="whg-attach-preview__frame"
              /*
                Пропорция кадра - из данных: по ней ряд плитки делит ширину
                так же, как на сайте, а кадр подряд держит форму 16:9 или 9:16.
              */
              style={{ aspectRatio: String(ratio), ['--whg-ratio' as string]: ratio }}
            />
          );
        })}
      </div>
    );
  }
  if (preview.kind === 'recording') {
    return (
      <div
        className={`whg-attach-preview whg-attach-preview--recording${preview.wide ? ' whg-attach-preview--wide' : ''}`}
      >
        <div className="whg-attach-preview__stage">
          <Poster src={preview.poster} />
          <span className="whg-attach-preview__play" aria-hidden>
            ▶
          </span>
        </div>
        <span className="whg-attach-preview__title">{preview.title}</span>
      </div>
    );
  }
  if (preview.kind === 'documents') {
    return (
      <ul
        className={`whg-attach-preview whg-attach-preview--documents whg-attach-preview--${preview.layout}`}
      >
        {preview.rows.map((row) => (
          <li key={row.id} className="whg-attach-preview__document">
            {preview.layout === 'cards' &&
              (row.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- кадр первой страницы в админке
                <img src={row.thumb} alt="" className="whg-attach-preview__thumb" />
              ) : (
                <span className="whg-attach-preview__thumb whg-attach-preview__kind">
                  {row.type}
                </span>
              ))}
            <span className="whg-attach-preview__name">{row.name}</span>
            <span className="whg-attach-preview__size">
              {[row.type, row.size].filter(Boolean).join(' · ')}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (preview.kind === 'empty') {
    return <EmptyView hint={preview.hint} action={preview.action} />;
  }
  return null;
}

/**
 * Файл не выбран: подсказка и кнопка, открывающая поля.
 *
 * @remarks
 * Без неё новый блок стоит пустой рамкой, а карандаш в шапке не говорит,
 * что именно тут надо сделать. Кнопка с текстом нажимает штатную кнопку
 * «Изменить» рядом: как открыть панель полей, решает Payload.
 */
function EmptyView({ hint, action }: { readonly hint: string; readonly action: string }) {
  const { EditButton } = useBlockComponentContext();
  const edit = useRef<HTMLSpanElement>(null);
  return (
    <div className="whg-attach-preview whg-attach-preview--empty">
      <span>{hint}</span>
      <button
        type="button"
        className="whg-attach-preview__action"
        onClick={() => edit.current?.querySelector('button')?.click()}
      >
        {action}
      </button>
      <span ref={edit} hidden>
        <EditButton />
      </span>
    </div>
  );
}

function Framed({ preview }: { readonly preview: AttachmentPreview }) {
  const { BlockCollapsible } = useBlockComponentContext();
  return (
    <BlockCollapsible>
      <PreviewView preview={preview} />
    </BlockCollapsible>
  );
}

export function GalleryPreview() {
  const keys = relationKeys(useFormFields(([fields]) => fields['files']?.value));
  const view = useFormFields(([fields]) => fields['view']?.value);
  return <Framed preview={galleryPreview(keys, useMediaCards(keys), view)} />;
}

export function VideoPreview() {
  const key = relationKey(useFormFields(([fields]) => fields['video']?.value));
  const ownTitle = useFormFields(([fields]) => fields['title']?.value);
  const width = useFormFields(([fields]) => fields['width']?.value);
  const cards = useMediaCards(key ? [key] : []);
  return <Framed preview={recordingPreview(key, cards, ownTitle, width)} />;
}

export function DocumentListPreview() {
  const fields = useFormFields(([all]) => all);
  const keys = rowValues(fields, 'items', 'file').map(relationKey);
  const titles = rowValues(fields, 'items', 'title');
  const cards = useMediaCards(keys.filter((key): key is string => key !== null));
  return <Framed preview={documentsPreview(keys, titles, cards, fields['layout']?.value)} />;
}
