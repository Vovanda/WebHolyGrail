import { Articles } from './Articles';
import { Authors } from './Authors';
import { Cities } from './Cities';
import { Comments } from './Comments';
import { MediaAccessCodes } from './MediaAccessCodes';
import { MediaAccessLinks } from './MediaAccessLinks';
import { MediaAccesses } from './MediaAccesses';
import { MediaAccessRights } from './MediaAccessRights';
import { KeyUsage } from './KeyUsage';
import { FaqGroups } from './FaqGroups';
import { FeatureToggles } from './FeatureToggles';
import { FormSubmissions } from './FormSubmissions';
import { Invoices } from './Invoices';
import { Media } from './Media';
import { Offers } from './Offers';
import { Orders } from './Orders';
import { Pages } from './Pages';
import { Playlists } from './Playlists';
import { ReusableBlocks } from './ReusableBlocks';
import { SocialPosts } from './SocialPosts';
import { Specialists } from './Specialists';
import { Tags } from './Tags';
import { Threads } from './Threads';
import { Users } from './Users';

/**
 * Коллекции движка - всё, что есть у любого сайта на этом шаблоне.
 *
 * @remarks
 * Набор ездит обновлением целиком и всегда полон: новая общая коллекция доезжает
 * до сайтов сама. Сборка сайта берёт его и дописывает своё доменное:
 *
 * ```ts
 * collections: [...engineCollections, Dogs, Litters].map(withAutoSlug),
 * ```
 *
 * Так у сайта не бывает ни отставания - когда коллекция приехала файлом, а в сборке
 * её нет и типы падают на ссылке в блок, - ни затирания своего при обновлении.
 *
 * Порядок задаёт порядок разделов в админке: сверху то, куда заходят каждый день,
 * снизу служебное. Первым идёт содержимое, за ним обращения от посетителей -
 * непрочитанная заявка стоит дороже ненаписанной статьи. Настройки и учётные
 * записи последними: их трогают редко, а место наверху занимали постоянно.
 *
 * Разделы, которые сайту не нужны, не выкидываются отсюда - они прячутся
 * переключателем в рантайме (задача про модули).
 */
export const engineCollections = [
  // Содержимое - то, из чего состоит сайт.
  Pages,
  ReusableBlocks,
  FaqGroups,
  // Медиа: сами файлы и наборы видео.
  Media,
  Playlists,
  // Заявки с форм - то, ради чего сайт обычно и заводят.
  FormSubmissions,
  // Магазин в порядке работы: что продаём, заказы на это, счета по заказам
  // (docs/whg/43-shop.md).
  Offers,
  Orders,
  Invoices,
  // Записи и всё вокруг них.
  Articles,
  Threads,
  Authors,
  // Теги последними: их трогают реже всего.
  Tags,
  // Доступы - своя группа: закрытой бывает любая запись, а не только видео.
  MediaAccesses,
  MediaAccessRights,
  MediaAccessCodes,
  MediaAccessLinks,
  KeyUsage,
  // Специалисты по городам: сами люди, потом справочник городов.
  Specialists,
  Cities,
  SocialPosts,
  Comments,
  // Настройки последними: их трогают редко. Что на сайте включено - значения
  // по окружениям, меняются без выкладки.
  Users,
  FeatureToggles,
];
