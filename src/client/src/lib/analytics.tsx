import Script from 'next/script';

/**
 * Yandex.Metrika tag. Подключается только если `NEXT_PUBLIC_YM_ID` задан в env.
 *
 * @remarks
 * Holy Grail-универсальный: каждый сайт-клиент задаёт свой ID в `.env.local`,
 * шаблон код не трогает. Стратегия `afterInteractive` — скрипт грузится после
 * гидратации, не блокирует LCP / FID.
 *
 * Включённые опции: clickmap, trackLinks, accurateTrackBounce, webvisor — стандарт
 * для веб-аналитики клиентских сайтов.
 */
export function YandexMetrika({ id }: { readonly id: string }) {
  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${id},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${id}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
