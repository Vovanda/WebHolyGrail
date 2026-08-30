import Hls from 'hls.js';

/**
 * Загрузчик потока, который умеет получать ключ шифрования.
 *
 * @remarks
 * Отдельной точки для ключей у движка нет - есть один загрузчик на все запросы.
 * Поэтому оборачиваем штатный: запрос ключа узнаём по пути, всё остальное -
 * плейлисты и сегменты - уходит дальше без изменений, прямо на сеть раздачи.
 *
 * Адрес ключа приходит из манифеста готовым: нарезка пишет туда дверь сайта,
 * а зеркальная ручка манифеста приводит к ней же записи, нарезанные раньше.
 * Собирать его здесь нечего - идём ровно по тому, что стоит в манифесте.
 *
 * Сам ключ приходит шестнадцатью байтами, разбирать нечего. Оборачиваем ради
 * другого: отличить отказ по праву от поломки и показать зрителю форму кода
 * вместо молчащего плеера.
 *
 * Общий для обоих слоёв управления: сам плеер о шифровании ничего не знает.
 *
 * Загрузчик не привязан к конкретному видео: запрос ключа узнаётся по виду
 * адреса, а не по номеру внутри него. Иначе при переходе к следующему видео
 * плейлиста пришлось бы собирать плеер заново - а вместе с ним пересоздавать
 * ползунки, на чём библиотека спотыкается и сыплет ошибками в консоль.
 */
export type KeyFailure = 'not-entitled' | 'not-ready' | 'error';

export interface KeyLoaderOptions {
  /** Ключ не выдан - показать причину вместо кадра. */
  readonly onFailure: (reason: KeyFailure) => void;
}

/** Причины, о которых сервер говорит прямо; остальное показываем как сбой. */
const KNOWN: ReadonlyArray<string> = ['not-entitled', 'not-ready'];

/** Как выглядит запрос ключа: номер видео внутри может быть любым. */
const KEY_PATH = /\/internal\/video\/key\/[^/?#]+/;

/**
 * Тот ли это запрос, ради которого мы обернули загрузчик.
 *
 * @remarks
 * Отдельно от самого перехвата: не узнав запрос, загрузчик пропустит ключ
 * мимо себя. Запись при этом играет - адрес свой, кука уходит и без нас, -
 * а ломается ветка отказа: зритель видит мёртвый кадр вместо формы кода.
 * Так уже было, когда адрес ключа сменился, а эта проверка осталась прежней.
 */
export function isKeyRequest(url: string): boolean {
  return KEY_PATH.test(url);
}

/** Запрос ключа с кукой идентичности. */
function askKey(url: string): Promise<Response> {
  return fetch(url, { credentials: 'include' });
}

/**
 * Причина отказа, не трогая тело ответа.
 *
 * @remarks
 * Тело читается через копию: разобранный ответ второй раз не прочитать, а он
 * ещё понадобится тому, кто вызвал.
 */
async function peekError(response: Response): Promise<string | null> {
  const body = (await response
    .clone()
    .json()
    .catch(() => ({}))) as { error?: string };
  return body.error ?? null;
}

export function createKeyLoader({ onFailure }: KeyLoaderOptions) {
  const DefaultLoader = Hls.DefaultConfig.loader;

  return class KeyAwareLoader extends DefaultLoader {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- контракт загрузчика задан библиотекой
    load(context: any, config: any, callbacks: any): void {
      const url = String(context?.url ?? '');
      if (!isKeyRequest(url)) {
        super.load(context, config, callbacks);
        return;
      }

      // Идём по тому же адресу, что стоит в плейлисте. Идентичность зрителя
      // уходит кукой, поэтому просим её приложить - без неё выдача видит
      // анонима, и закрытое не откроется даже тому, у кого право есть.
      askKey(url)
        .then(async (response) => {
          // Идентичности нет - зритель пришёл впервые. Заводим его и повторяем
          // один раз: открытая запись после этого играет сразу, а закрытая
          // честно отвечает, что нужен код.
          if (response.status === 403 && (await peekError(response)) === 'bad-token') {
            await fetch('/internal/video/token', { method: 'POST', credentials: 'include' });
            return askKey(url);
          }
          return response;
        })
        .then(async (response) => {
          if (!response.ok) {
            const body = (await response.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error ?? String(response.status));
          }
          return response.arrayBuffer();
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
          onFailure(KNOWN.includes(error.message) ? (error.message as KeyFailure) : 'error');
          callbacks.onError({ code: 403, text: error.message }, context, null, {});
        });
    }
  };
}
