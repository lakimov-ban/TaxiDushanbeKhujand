import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CarOffer } from '../booking.data';
import { formatDateShort, formatMoney, plural } from '../booking.format';
import { BookingStore } from '../booking.store';

interface CarCard {
  offer: CarOffer;
  tariff: string;
  seats: string;
  total: string;
  perSeat: string;
}

@Component({
  selector: 'app-cars-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step">
      <div class="head">
        <h1 class="step-title" data-step-title tabindex="-1">{{ dateLabel() }}</h1>
        <p class="muted">{{ summary() }}</p>
      </div>
      <ul class="list" aria-label="Свободные машины">
        @for (car of cards(); track car.offer.time + car.offer.model) {
          <li>
            <button type="button" class="car" (click)="store.pickCar(car.offer)">
              <span class="time">{{ car.offer.time }}</span>
              <span class="info">
                <span class="model">
                  {{ car.offer.model }}
                  <span class="tariff" [class.comfort]="car.offer.comfort">{{ car.tariff }}</span>
                </span>
                <span class="seats muted">{{ car.seats }}</span>
              </span>
              <span class="price">
                <span class="total">{{ car.total }}</span>
                <span class="per muted">{{ car.perSeat }}</span>
              </span>
            </button>
          </li>
        } @empty {
          <li class="empty">
            На эту дату нет машин с нужным числом мест. Выберите другую дату или уменьшите число
            пассажиров.
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .step { max-width: 720px; justify-content: flex-start; gap: 14px; }
    .head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .head p { margin: 0; font-size: 15px; }
    .list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0 0 4px; list-style: none; }
    .car {
      width: 100%; display: flex; align-items: center; gap: clamp(12px, 3vw, 28px);
      padding: 14px 20px; border: 0; border-radius: 22px; background: var(--card); text-align: left; cursor: pointer;
    }
    .car:hover { box-shadow: 0 0 0 3px var(--accent); }
    .time { flex: none; width: clamp(72px, 12vw, 96px); font-size: clamp(26px, 5vw, 34px); font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
    .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .model { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 17px; font-weight: 600; }
    .tariff { padding: 3px 10px; border-radius: 999px; font-size: 12px; background: var(--accent-soft); }
    .tariff.comfort { background: var(--ink); color: var(--paper); }
    .seats, .per { font-size: 13px; }
    .price { flex: none; display: flex; flex-direction: column; text-align: right; }
    .total { font-size: clamp(18px, 3.5vw, 24px); font-weight: 700; }
    .empty { padding: 20px 0; font-size: 18px; color: var(--muted); }
  `,
})
export class CarsStep {
  protected readonly store = inject(BookingStore);

  protected readonly dateLabel = computed(() => {
    const date = this.store.date();
    return date ? formatDateShort(date) : '';
  });

  protected readonly summary = computed(
    () =>
      `${this.store.route().join(' → ')} · ` +
      plural(this.store.passengers(), 'пассажир', 'пассажира', 'пассажиров'),
  );

  protected readonly cards = computed<CarCard[]>(() =>
    this.store.availableCars().map((offer) => {
      const price = this.store.priceFor(offer);
      return {
        offer,
        tariff: offer.comfort ? 'Комфорт' : 'Эконом',
        seats: 'Свободно ' + plural(offer.seatsLeft, 'место', 'места', 'мест'),
        total: formatMoney(price.total),
        perSeat: `от ${formatMoney(price.perSeat)} за место`,
      };
    }),
  );
}
