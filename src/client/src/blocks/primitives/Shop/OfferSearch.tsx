'use client';

import { useId, useState } from 'react';

import { useOfferSuggest } from '@/lib/shop/use-offer-suggest';

import { OfferSuggestions } from './OfferSuggestions';
import { field } from './ui';

/**
 * Поиск позиций с добавлением прямо из корзины.
 *
 * @remarks
 * Части: поле запроса и список найденного (`OfferSuggestions`), у каждой строки -
 * счётчик количества и «Добавить». Клиентский компонент по необходимости (R14):
 * набор и список живут в браузере. После добавления поле очищается: в корзине
 * добавляют по одной позиции и сразу видят её строкой.
 */
export function OfferSearch({ label = 'Добавить в заказ' }: { readonly label?: string }) {
  const [query, setQuery] = useState('');
  const found = useOfferSuggest(query);
  const listId = useId();

  return (
    <div data-part="offer-search" className="relative">
      <label className="grid gap-1.5 text-sm text-muted">
        {label}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Название позиции"
          autoComplete="off"
          aria-controls={listId}
          aria-expanded={found !== null}
          className={field}
        />
      </label>
      {found !== null && (
        <OfferSuggestions id={listId} found={found} onAdded={() => setQuery('')} />
      )}
    </div>
  );
}
