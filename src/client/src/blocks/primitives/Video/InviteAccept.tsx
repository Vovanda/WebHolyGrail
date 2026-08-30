'use client';

import { useEffect, useRef, useState } from 'react';

import { invitePath, type InviteAddress, type InviteResource } from './invite-path';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * Приём ссылки-приглашения.
 *
 * @remarks
 * Клиентский по необходимости (R14): приём должен положить в браузер токен
 * с выданным правом, а поставить куку по дороге к странице сервер не может —
 * он либо отдаёт содержимое, либо ставит куку, но не то и другое разом.
 *
 * Поэтому страница приглашения ничего не показывает надолго: она гасит ссылку
 * и сразу уводит к содержимому. Видимым остаётся только отказ — его человек
 * должен прочитать словами, чтобы понять, просить ли новую ссылку.
 */
export interface InviteAcceptProps {
  /** Адрес из присланного приглашения. */
  readonly link: string;
  /** Токен зрителя: в него ложится идентичность, по которому найдётся право. */
  readonly className?: string;
}

/**
 * Что показать вместо кода отказа.
 *
 * @remarks
 * Причины разные, в отличие от кода доступа: подобрать адрес ссылки нельзя,
 * поэтому скрывать за общим «не сработало» нечего, а человеку важно понимать,
 * идти ли за новой ссылкой к тому, кто её прислал.
 */
const REASON: Record<string, string> = {
  revoked: 'Эту ссылку отозвали. Попросите новую у того, кто её прислал.',
  expired: 'Срок ссылки истёк. Попросите новую у того, кто её прислал.',
  'used-up': 'Ссылка сработала столько раз, сколько было разрешено.',
  'not-found': 'Такой ссылки нет. Проверьте, что адрес скопирован целиком.',
  'bad-token': 'Страница открыта слишком давно — обновите её и попробуйте снова.',
  unavailable: 'Не удалось связаться с сервером. Попробуйте обновить страницу.',
};

const FALLBACK = 'Ссылка не сработала. Попросите новую у того, кто её прислал.';

export function InviteAccept({ link, className }: InviteAcceptProps) {
  const [error, setError] = useState<string | null>(null);
  // Приём случается один раз за открытие страницы: в строгом режиме разработки
  // эффект зовётся дважды, и без этого ссылка израсходовала бы два срабатывания.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      const response = await fetch('/internal/video/redeem-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link }),
      }).catch(() => null);

      if (!response) {
        setError(REASON['unavailable'] ?? FALLBACK);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        address?: InviteAddress | null;
        resource?: InviteResource;
      };

      if (!response.ok) {
        setError((data.error && REASON[data.error]) ?? FALLBACK);
        return;
      }

      // Адреса может не быть у только что залитого - тогда ведём на канал,
      // а не на несуществующую страницу: право уже выдано, и терять его незачем.
      const path = invitePath(data.resource, data.address ?? null);

      /*
        Переход полный, а не внутренний: страница подборки читает право
        на сервере, а внутренний переход отдал бы её из памяти маршрутизатора -
        той, что браузер видел до выдачи. Приглашение открывают один раз,
        плавность здесь ничего не стоит.
      */
      window.location.replace(path ?? '/');
    })();
  }, [link]);

  return (
    <section data-part="invite-accept" className={cn('px-4 py-24 text-center md:py-32', className)}>
      <div className="mx-auto max-w-content">
        {error ? (
          <>
            <h1
              data-part="invite-title"
              className="font-display text-h3 md:text-h2 text-ink font-semibold"
            >
              Ссылка не сработала
            </h1>
            <p data-part="invite-error" className="text-muted mt-4">
              {error}
            </p>
            <Link
              href="/"
              className="bg-accent text-accent-fg hover:bg-accent-hover mt-8 inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium transition-colors"
            >
              На главную
            </Link>
          </>
        ) : (
          <>
            <h1
              data-part="invite-title"
              className="font-display text-h3 md:text-h2 text-ink font-semibold"
            >
              Открываем доступ
            </h1>
            {/*
              Подпись, а не крутящийся кружок: приём занимает доли секунды,
              и появившийся на них указатель загрузки мигает сильнее, чем строка.
            */}
            <p data-part="invite-progress" className="text-muted mt-4">
              Ещё секунда — и покажем содержимое.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
