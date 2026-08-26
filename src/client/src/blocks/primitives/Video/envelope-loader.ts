import Hls from 'hls.js';

/**
 * Загрузчик потока, который умеет получать ключ шифрования.
 *
 * @remarks
 * Отдельной точки для ключей у движка нет - есть один загрузчик на все запросы.
 * Поэтому оборачиваем штатный: запрос ключа узнаём по пути, всё остальное -
 * плейлисты и куски видео - уходит дальше без изменений, прямо на сеть раздачи.
 *
 * Узнаём именно по пути, а не по полному адресу: снаружи известен только тот
 * адрес, что стоит в плейлисте, и собран он из публичного имени сайта. Сверка
 * с адресом CMS ломалась на проде - контейнеру он известен под внутренним
 * именем, совпадения не было, и ключ уходил без токена.
 *
 * Общий для обоих слоёв управления: сам плеер о шифровании ничего не знает.
 */
export type EnvelopeFailure = 'sign-in-required' | 'not-entitled' | 'not-ready' | 'error';

export interface EnvelopeLoaderOptions {
  readonly mediaId: string | number;
  /** Токен зрителя: им вскрывается конверт с ключом. */
  readonly token: string;
  /** Ключ не выдан - показать причину вместо кадра. */
  readonly onFailure: (reason: EnvelopeFailure) => void;
}

/** Причины, о которых сервер говорит прямо; остальное показываем как сбой. */
const KNOWN: ReadonlyArray<string> = ['sign-in-required', 'not-entitled', 'not-ready'];

export function createEnvelopeLoader({ mediaId, token, onFailure }: EnvelopeLoaderOptions) {
  const envelopePath = `/api/video/${mediaId}/envelope`;
  const DefaultLoader = Hls.DefaultConfig.loader;

  return class EnvelopeAwareLoader extends DefaultLoader {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- контракт загрузчика задан библиотекой
    load(context: any, config: any, callbacks: any): void {
      const url = String(context?.url ?? '');
      if (!url.includes(envelopePath)) {
        super.load(context, config, callbacks);
        return;
      }

      // Идём по тому же адресу, что стоит в плейлисте, дописав токен: он
      // публичный и заведомо доступен зрителю. Куку шлём явно - без неё
      // эндпоинт увидит анонима, и закрытое видео не откроется.
      const separator = url.includes('?') ? '&' : '?';
      fetch(`${url}${separator}token=${encodeURIComponent(token)}`, { credentials: 'include' })
        .then(async (response) => {
          if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? String(response.status));
          }
          const { envelope } = (await response.json()) as { envelope: string };
          return openEnvelope(envelope, token);
        })
        .then((key) => {
          callbacks.onSuccess(
            { url: context.url, data: key },
            { code: 200, text: '' },
            context,
            null,
          );
        })
        .catch((error: Error) => {
          onFailure(KNOWN.includes(error.message) ? (error.message as EnvelopeFailure) : 'error');
          callbacks.onError({ code: 403, text: error.message }, context, null, {});
        });
    }
  };
}

/**
 * Вскрывает конверт ключом из токена зрителя.
 *
 * @remarks
 * Ключ лежит в самом токене и отдельно нигде не хранится: сервер собирает его
 * при проверке подписи, браузер берёт из своей же строки.
 */
export async function openEnvelope(envelope: string, token: string): Promise<ArrayBuffer> {
  const [rawKey] = token.split('.');
  const key = await crypto.subtle.importKey(
    'raw',
    base64urlToBytes(rawKey ?? ''),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  const [iv, sealed, tag] = envelope.split('.') as [string, string, string];
  // WebCrypto ждёт метку подлинности приклеенной к шифротексту, а сервер отдаёт
  // её отдельно - склеиваем здесь.
  const sealedBytes = new Uint8Array(base64urlToBytes(sealed));
  const tagBytes = new Uint8Array(base64urlToBytes(tag));
  const payload = new Uint8Array(sealedBytes.length + tagBytes.length);
  payload.set(sealedBytes);
  payload.set(tagBytes, sealedBytes.length);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64urlToBytes(iv) }, key, payload);
}

function base64urlToBytes(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
