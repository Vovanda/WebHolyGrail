'use client';

import { useEffect } from 'react';

import { DetailDrawer, openDetail } from '@/blocks/primitives/DetailDrawer';

import { AccessCodeForm } from './AccessCodeForm';

/**
 * @deprecated Ввод кода переехал на место плеера: форма стоит там, где человек
 * упёрся в замок, и подборка остаётся перед глазами. Окно больше нигде
 * не открывается и держится только ради сайтов, собранных на прежнем шаблоне
 * (R10) - убрать после того, как они получат синк.
 *
 * Окно ввода кода — открывается по нажатию на закрытый видео.
 *
 * @remarks
 * Замок сам по себе тупик: человек видит, что нельзя, и не понимает, что
 * делать. Поэтому нажатие на закрытый видео ведёт не в никуда, а сюда, где
 * сразу можно ввести код.
 *
 * Окно центральное, а не панелью сбоку: это короткое решение, которое требует
 * внимания, и разглядывать за ним список незачем (см. канон модалок).
 *
 * Своего окна не пишем — у примитива уже есть закрытие по Esc, по фону и
 * кнопкой «назад», блокировка прокрутки и адрес в ссылке (R9).
 */
export interface AccessCodeDialogProps {
  /** Токен зрителя: в него дописывается плейлист при погашении. */
  readonly token: string;
}

/** Ключ окна: он же попадает в адрес, поэтому ссылка на открытое окно работает. */
const SLUG = 'code:enter';

/** Открыть окно ввода кода из любого места. */
export function openAccessCodeDialog(): void {
  openDetail(SLUG);
}

export function AccessCodeDialog() {
  // Нажатие на любой закрытый видео открывает окно. Слушаем на документе, а не
  // вешаем обработчик каждому элементу списка: списков на странице несколько,
  // и они перерисовываются при переключении.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      const target = (event.target as HTMLElement | null)?.closest('[data-access-code]');
      if (!target) return;
      event.preventDefault();
      openAccessCodeDialog();
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <DetailDrawer slug={SLUG} placement="center" className="p-6">
      <div className="flex flex-col gap-3">
        <h2
          data-part="title"
          className="text-h4 font-display font-semibold tracking-tight text-ink"
        >
          Видео открывается по коду.
        </h2>
        <p data-part="subtitle" className="text-body text-muted">
          Введите код, который вам прислали, и закрытые видео плейлиста заиграют.
        </p>
        <AccessCodeForm />
      </div>
    </DetailDrawer>
  );
}
