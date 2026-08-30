import { Articles } from './Articles';
import { Authors } from './Authors';
import { Comments } from './Comments';
import { MediaAccessCodes } from './MediaAccessCodes';
import { MediaAccessLinks } from './MediaAccessLinks';
import { MediaAccesses } from './MediaAccesses';
import { MediaAccessRights } from './MediaAccessRights';
import { KeyUsage } from './KeyUsage';
import { FaqGroups } from './FaqGroups';
import { FeatureToggles } from './FeatureToggles';
import { FormSubmissions } from './FormSubmissions';
import { Media } from './Media';
import { Pages } from './Pages';
import { Playlists } from './Playlists';
import { ReusableBlocks } from './ReusableBlocks';
import { SocialPosts } from './SocialPosts';
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
  // Обращения - то, ради чего сайт обычно и заводят.
  FormSubmissions,
  // Записи и всё вокруг них.
  Articles,
  Threads,
  Tags,
  Authors,
  // Медиа: сами файлы, наборы видео, права на них и коды, которые эти права выдают.
  // Доступ живёт рядом с видео, а не отдельным разделом - человек ищет его там,
  // где лежит сам файл.
  Media,
  Playlists,
  MediaAccesses,
  MediaAccessRights,
  MediaAccessCodes,
  MediaAccessLinks,
  KeyUsage,
  // Каталог специалистов по городам.
  SocialPosts,
  Comments,
  // Что на сайте включено: значения по окружениям, меняются без выкладки.
  FeatureToggles,
  Users,
];
