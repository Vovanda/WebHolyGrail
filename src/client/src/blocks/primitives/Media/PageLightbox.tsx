'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';

import { laneSources } from '@/lib/lane';
import { PAGE_GROUP, parseLaneHash } from '@/lib/lane-hash';

import { LaneOverlay } from './LaneOverlay';
import { leaveLane, pushLane, replaceLane } from './lane-history';
import { LANE_PROPS } from './lane-look';
import { useLaneFrame } from './useLaneFrame';
import { useLaneZoom } from './useLaneZoom';
import { collectShots } from './lane-shots';
import type { Shot } from './types';

/**
 * Лента страницы: кадры, открытые на весь экран.
 *
 * @remarks
 * Стоит один раз в раскладке сайта и слушает нажатия по всей странице. Кадр
 * в ленту записывает не блок, а кубик `MediaImage`: он помечает себя и кладёт
 * рядом всё нужное для показа крупно. Поэтому новый блок получает открытие
 * просто потому, что показал картинку кубиком, - помнить и подключать нечего.
 *
 * Здесь только оркестрация: что открыто, что происходит с адресом, где стоят
 * кнопки. Чтение разметки живёт в `lane-shots`, счёт - в `lib/lane`, подпись -
 * в своём компоненте.
 */
export function PageLightbox() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  /*
    Лента закрывается с затуханием, и всё это время она ещё на экране. Подпись
    лежит своим слоем, поэтому без этого признака она снималась мгновенно -
    и текст пропадал раньше кадра, рывком.
  */
  const [closing, setClosing] = useState(false);

  const isOpen = index !== null;
  const shot = index !== null ? shots[index] : undefined;
  const close = useCallback(() => setIndex(null), []);

  // Нажатие по помеченному кадру открывает ленту с него.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Нажатие с зажатой клавишей и не левой кнопкой оставляем браузеру:
      // это «открыть в новой вкладке» и вызов своего меню.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const hit = target?.closest('[data-zoom]');
      /*
        Кадр внутри чужой ссылки не перехватывается: у неё своё назначение,
        и отнимать его нельзя. Своя ссылка - та, что кубик завернул вокруг
        кадра ради работы без скрипта, - помечена и перехватывается.
      */
      if (!hit) return;
      const link = hit.closest('a');
      if (link && !link.hasAttribute('data-zoom-link')) return;

      const { shots: found, nodes } = collectShots();
      const at = nodes.indexOf(hit);
      if (at < 0) return;

      event.preventDefault();
      setShots(found);
      setIndex(at);
      setClosing(false);
      pushLane(PAGE_GROUP, at);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Кнопка «назад» и движение пальцем от края закрывают ленту, а не уводят
  // со страницы: открытие добавило запись в историю, и шаг назад снимает её.
  useEffect(() => {
    function onPop() {
      if (parseLaneHash(window.location.hash)?.group !== PAGE_GROUP) close();
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [close]);

  // Открытая по присланной ссылке страница показывает ленту сразу.
  useEffect(() => {
    const at = parseLaneHash(window.location.hash);
    if (at?.group !== PAGE_GROUP) return;
    const { shots: found } = collectShots();
    if (at.index >= found.length) return;
    setShots(found);
    setIndex(at.index);
  }, []);

  useLaneFrame({ open: isOpen, zoomed, blur: shot?.blur });

  const slides = useMemo(
    () =>
      shots.map((item) => ({
        src: item.src,
        alt: item.alt,
        // Набор уходит в ленту целиком: подходящий выберет экран зрителя.
        ...(item.set.length > 1 ? { srcSet: laneSources(item.set, item) } : {}),
      })),
    [shots],
  );

  const leave = useCallback(() => {
    setClosing(true);
    close();
    leaveLane();
  }, [close]);

  const zoom = useLaneZoom(isOpen ? slides[index] : undefined);

  if (!isOpen || slides.length === 0) return null;

  return (
    <>
      <Lightbox
        {...LANE_PROPS}
        zoom={zoom}
        open
        index={index}
        slides={slides}
        close={leave}
        on={{
          /*
            Полотно снимается на первом же увеличении и возвращается, когда
            масштаб пришёл обратно к единице. Своей ступени здесь нет: лента
            считает единицей кадр, вписанный в полотно, и любая попытка
            подменить ей масштаб рассогласовывала кнопки - «плюс» уводил
            не туда, «минус» не возвращал.
          */
          zoom: ({ zoom }) => setZoomed(zoom > 1),

          view: ({ index: at }) => {
            setZoomed(false);
            setIndex(at);
            replaceLane(PAGE_GROUP, at);
          },
        }}
        render={{ controls: () => (shot ? <LaneOverlay shot={shot} closing={closing} /> : null) }}
      />
    </>
  );
}
