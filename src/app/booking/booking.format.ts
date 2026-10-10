export const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const WEEKDAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const WEEKDAYS_LONG = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

/** Дата как число ГГГГММДД — удобно сравнивать и хранить. */
export function dateKey(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function fromDateKey(key: number): Date {
  return new Date(Math.floor(key / 10000), (Math.floor(key / 100) % 100) - 1, key % 100);
}

/** «10 октября, сб» */
export function formatDateShort(key: number): string {
  const d = fromDateKey(key);
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}, ${WEEKDAYS_SHORT[d.getDay()]}`;
}

/** «10 октября 2026, суббота» — для экранных дикторов. */
export function formatDateLong(key: number): string {
  const d = fromDateKey(key);
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]} ${d.getFullYear()}, ${WEEKDAYS_LONG[d.getDay()]}`;
}

/** «1 250 сом.» с неразрывными пробелами. */
export function formatMoney(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' сом.';
}

/** plural(5, 'место', 'места', 'мест') → «5 мест» */
export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  const word =
    m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
  return `${n} ${word}`;
}
