import { LatLng } from '../shared/yandex-maps/ymaps.types';

export interface City {
  name: string;
  center: LatLng;
}

export const CITIES: readonly City[] = [
  { name: 'Душанбе', center: [38.5598, 68.787] },
  { name: 'Худжанд', center: [40.2826, 69.6222] },
  { name: 'Бохтар', center: [37.8364, 68.7803] },
  { name: 'Куляб', center: [37.9146, 69.7845] },
  { name: 'Истаравшан', center: [39.9108, 69.0064] },
  { name: 'Гиссар', center: [38.5263, 68.5513] },
  { name: 'Турсунзаде', center: [38.5108, 68.2303] },
  { name: 'Пенджикент', center: [39.4952, 67.6093] },
];

export function findCity(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}

/** Быстрые подсказки, пока пользователь ещё ничего не ввёл. */
export const POPULAR_STREETS = ['пр. Рудаки, 12', 'ул. Айни, 45', 'ул. Бохтар, 7', 'ул. Шотемур, 20'];

export interface LuggageOption {
  name: string;
  hint: string;
}

export const LUGGAGE_OPTIONS: readonly LuggageOption[] = [
  { name: 'Без багажа', hint: 'Только личные вещи' },
  { name: 'Ручная кладь', hint: 'Рюкзак, сумка' },
  { name: 'Чемодан', hint: 'До 70 см на человека' },
  { name: 'Крупный груз', hint: 'Коляска, лыжи, коробки' },
];

export interface CarOffer {
  time: string;
  model: string;
  comfort: boolean;
  seatsLeft: number;
}

const DEPARTURES = ['06:30', '08:00', '09:30', '11:00', '13:30', '15:00', '17:30', '19:00', '21:30'];
const MODELS: readonly [string, boolean][] = [
  ['Skoda Octavia', false],
  ['Kia Rio', false],
  ['Hyundai Solaris', false],
  ['Toyota Camry', true],
  ['Kia K5', true],
  ['Mercedes V-Class', true],
];

/**
 * Демо-расписание на день: детерминированно зависит от даты.
 * Заменить на запрос к API, когда появится бэкенд.
 */
export function carsForDate(dateKey: number): CarOffer[] {
  const count = 3 + (dateKey % 3);
  const out: CarOffer[] = [];
  for (let i = 0; i < count; i++) {
    const time = DEPARTURES[(dateKey * 3 + i * 4 + (dateKey % 5)) % DEPARTURES.length];
    if (out.some((c) => c.time === time)) continue;
    const [model, comfort] = MODELS[(dateKey + i * 5) % MODELS.length];
    const minivanBonus = model.startsWith('Mercedes V-') ? 2 : 0;
    out.push({ time, model, comfort, seatsLeft: 1 + ((dateKey + i * 7) % 4) + minivanBonus });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}
