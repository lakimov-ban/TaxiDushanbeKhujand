import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LUGGAGE_OPTIONS } from '../booking.data';
import { BookingStore, MAX_ADULTS, MAX_KIDS } from '../booking.store';

@Component({
  selector: 'app-passengers-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step">
      <h1 class="step-title" data-step-title tabindex="-1">Пассажиры и багаж</h1>

      <div class="counters">
        <div class="counter">
          <div>
            <div class="label" id="adults-label">Взрослые</div>
            <div class="hint">от 12 лет</div>
          </div>
          <div class="controls" role="group" aria-labelledby="adults-label">
            <button
              type="button"
              class="round-btn"
              aria-label="Меньше взрослых"
              [disabled]="store.adults() <= 1"
              (click)="store.adults.set(store.adults() - 1)"
            >
              −
            </button>
            <output class="value" aria-live="polite">{{ store.adults() }}</output>
            <button
              type="button"
              class="round-btn accent"
              aria-label="Больше взрослых"
              [disabled]="store.adults() >= maxAdults"
              (click)="store.adults.set(store.adults() + 1)"
            >
              +
            </button>
          </div>
        </div>

        <div class="counter">
          <div>
            <div class="label" id="kids-label">Дети</div>
            <div class="hint">до 12 лет, цена ниже</div>
          </div>
          <div class="controls" role="group" aria-labelledby="kids-label">
            <button
              type="button"
              class="round-btn"
              aria-label="Меньше детей"
              [disabled]="store.kids() <= 0"
              (click)="store.kids.set(store.kids() - 1)"
            >
              −
            </button>
            <output class="value" aria-live="polite">{{ store.kids() }}</output>
            <button
              type="button"
              class="round-btn accent"
              aria-label="Больше детей"
              [disabled]="store.kids() >= maxKids"
              (click)="store.kids.set(store.kids() + 1)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <h2 class="subhead" id="luggage-label">Багаж</h2>
      <div class="luggage" role="group" aria-labelledby="luggage-label">
        @for (option of luggage; track option.name; let i = $index) {
          <button
            type="button"
            class="option"
            [class.selected]="store.luggage() === i"
            [attr.aria-pressed]="store.luggage() === i"
            (click)="store.luggage.set(i)"
          >
            <span class="label">{{ option.name }}</span>
            <span class="hint">{{ option.hint }}</span>
          </button>
        }
      </div>
    </section>
  `,
  styles: `
    .step { max-width: 520px; gap: 20px; }
    .counters { display: flex; flex-direction: column; gap: 8px; }
    .counter {
      display: flex; align-items: center; justify-content: space-between;
      height: 64px; padding: 0 16px; border-radius: 18px; background: var(--card);
    }
    .controls { display: flex; align-items: center; gap: 14px; }
    .value { width: 20px; text-align: center; font-size: 20px; font-weight: 600; }
    .label { display: block; font-size: 18px; font-weight: 600; }
    .hint { display: block; font-size: 13px; color: var(--muted); }
    .subhead { margin: 0 0 -10px; font-size: 14px; font-weight: 400; color: var(--muted); }
    .luggage { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; }
    .option {
      padding: 12px 16px; border: 0; border-radius: 18px; background: var(--card);
      text-align: left; cursor: pointer;
    }
    .option .label { font-size: 16px; }
    .option:hover:not(.selected) { background: var(--sand); }
    .option.selected { background: var(--accent); }
    .option.selected .hint { color: var(--ink); }
  `,
})
export class PassengersStep {
  protected readonly store = inject(BookingStore);
  protected readonly luggage = LUGGAGE_OPTIONS;
  protected readonly maxAdults = MAX_ADULTS;
  protected readonly maxKids = MAX_KIDS;
}
