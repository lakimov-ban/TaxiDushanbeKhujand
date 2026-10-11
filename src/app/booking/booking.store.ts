import { Injectable, computed, signal } from '@angular/core';
import { LatLng } from '../shared/yandex-maps/ymaps.types';
import { CarOffer, LUGGAGE_OPTIONS, carsForDate } from './booking.data';
import { dateKey, formatMoney } from './booking.format';

export type BookingStep =
  | 'welcome'
  | 'cities'
  | 'address'
  | 'date'
  | 'passengers'
  | 'cars'
  | 'confirm'
  | 'done';

const STEPS: readonly BookingStep[] = [
  'welcome', 'cities', 'address', 'date', 'passengers', 'cars', 'confirm', 'done',
];

export interface RoutePoint {
  city: string;
  address: string;
  /** Точка, выбранная на карте или найденная геокодером; null — адрес введён вручную. */
  coords: LatLng | null;
}

export const MAX_ADULTS = 6;
export const MAX_KIDS = 4;
const BASE_PRICE_PER_SEGMENT = 150;
const COMFORT_RATE = 1.6;
const KID_RATE = 0.7;
const LUGGAGE_SURCHARGE = 25;

/** Состояние мастера бронирования. Живёт, пока открыта страница бронирования. */
@Injectable()
export class BookingStore {
  readonly today = dateKey(new Date());

  readonly step = signal<BookingStep>('welcome');
  readonly route = signal<string[]>([]);
  readonly cityQuery = signal('');
  readonly points = signal<RoutePoint[]>([]);
  readonly pointIndex = signal(0);
  readonly month = signal(this.initialMonth());
  readonly date = signal<number | null>(null);
  readonly adults = signal(1);
  readonly kids = signal(0);
  readonly luggage = signal(0);
  readonly car = signal<CarOffer | null>(null);
  readonly name = signal('');
  readonly phone = signal('');

  readonly routeComplete = computed(() => this.route().length === 2);
  readonly currentPoint = computed<RoutePoint | undefined>(() => this.points()[this.pointIndex()]);
  readonly passengers = computed(() => this.adults() + this.kids());

  readonly availableCars = computed(() => {
    const date = this.date();
    return date ? carsForDate(date).filter((c) => c.seatsLeft >= this.passengers()) : [];
  });

  readonly total = computed(() => {
    const car = this.car();
    return car ? this.priceFor(car).total : 0;
  });

  readonly canNext = computed(() => {
    switch (this.step()) {
      case 'cities':
        return this.routeComplete();
      case 'address':
        return (this.currentPoint()?.address.trim().length ?? 0) > 0;
      case 'date':
        return this.date() !== null;
      case 'confirm':
        return this.name().trim().length > 0 && this.phone().replace(/\D/g, '').length >= 10;
      default:
        return true;
    }
  });

  readonly showBar = computed(() => !['welcome', 'done'].includes(this.step()));
  readonly showNext = computed(
    () => this.step() !== 'cars' && !(this.step() === 'cities' && !this.routeComplete()),
  );
  readonly nextLabel = computed(() =>
    this.step() === 'confirm' ? `Подтвердить · ${formatMoney(this.total())}` : 'Далее',
  );

  priceFor(car: CarOffer): { total: number; perSeat: number } {
    const segments = Math.max(1, this.route().length - 1);
    const seat = BASE_PRICE_PER_SEGMENT * segments * (car.comfort ? COMFORT_RATE : 1);
    const raw = seat * (this.adults() + this.kids() * KID_RATE) + this.luggage() * LUGGAGE_SURCHARGE;
    return { total: roundTo5(raw), perSeat: roundTo5(seat) };
  }

  luggageName(): string {
    return LUGGAGE_OPTIONS[this.luggage()].name;
  }

  start(): void {
    this.step.set('cities');
  }

  reset(): void {
    this.step.set('welcome');
    this.route.set([]);
    this.cityQuery.set('');
    this.points.set([]);
    this.pointIndex.set(0);
    this.month.set(this.initialMonth());
    this.date.set(null);
    this.adults.set(1);
    this.kids.set(0);
    this.luggage.set(0);
    this.car.set(null);
    this.name.set('');
    this.phone.set('');
  }

  pickCity(city: string): void {
    if (this.routeComplete()) return;
    this.route.update((r) => [...r, city]);
    this.cityQuery.set('');
  }

  setPoint(index: number, patch: Partial<Omit<RoutePoint, 'city'>>): void {
    this.points.update((list) => list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  pickCar(car: CarOffer): void {
    this.car.set(car);
    this.step.set('confirm');
  }

  next(): void {
    if (!this.canNext()) return;
    const step = this.step();
    if (step === 'cities') {
      const prev = this.points();
      // Уже введённые адреса сохраняются, если город на этой позиции не поменялся.
      this.points.set(
        this.route().map((city, i) =>
          prev[i]?.city === city ? prev[i] : { city, address: '', coords: null },
        ),
      );
      this.pointIndex.set(0);
      this.step.set('address');
    } else if (step === 'address' && this.pointIndex() < this.points().length - 1) {
      this.pointIndex.update((i) => i + 1);
    } else {
      this.step.set(STEPS[STEPS.indexOf(step) + 1]);
    }
  }

  back(): void {
    const step = this.step();
    if (step === 'address' && this.pointIndex() > 0) {
      this.pointIndex.update((i) => i - 1);
    } else if (step === 'cities') {
      if (this.route().length) this.route.update((r) => r.slice(0, -1));
      else this.step.set('welcome');
      this.cityQuery.set('');
    } else {
      this.step.set(STEPS[Math.max(0, STEPS.indexOf(step) - 1)]);
    }
  }

  private initialMonth(): { year: number; month: number } {
    return { year: Math.floor(this.today / 10000), month: (Math.floor(this.today / 100) % 100) - 1 };
  }
}

function roundTo5(value: number): number {
  return Math.round(value / 5) * 5;
}
