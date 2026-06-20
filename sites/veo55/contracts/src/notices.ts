/**
 * Generic-блоки уведомлений / сертификатов.
 */

export interface CertifiedNoticeCriterion {
  readonly id: string;
  readonly text: string;
}

/**
 * Generic «сертифицированный статус» — kicker над заголовком + описание + чек-лист
 * критериев. Заводчик использует под «Отборное разведение РКФ», автосервис — под
 * «Авторизованный дилер», и т.д. Все тексты в БД (R0).
 */
export interface CertifiedNoticeBlockNode {
  readonly blockType: 'certified-notice';
  readonly id: string;
  readonly kicker?: string;
  readonly title?: string;
  readonly body?: string;
  readonly criteriaTitle?: string;
  readonly criteria?: readonly CertifiedNoticeCriterion[];
}
