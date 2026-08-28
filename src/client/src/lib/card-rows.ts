/**
 * Счёт рядов переехал в contracts: им пользуется и сайт, и админка.
 *
 * @remarks
 * Прежний путь оставлен, чтобы сайты, собранные на шаблоне, не сломались
 * на импорте. Новый код берёт из contracts напрямую.
 */
export { balancedRows, splitIntoRows } from 'contracts';
