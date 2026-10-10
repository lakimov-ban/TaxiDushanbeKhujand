import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MONTHS, formatDateLong } from '../booking.format';
import { BookingStore } from '../booking.store';

interface DayCell {
  key: number;
  day: number;
  label: string;
  past: boolean;
  today: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-date-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step">
      <div class="head">
        <h1 class="step-title" data-step-title tabindex="-1">Когда едем</h1>
        <div class="nav">
          <button
            type="button"
            class="round-btn"
            aria-label="Предыдущий месяц"
            [disabled]="!canPrev()"
            (click)="shiftMonth(-1)"
          >
            ‹
          </button>
          <button type="button" class="round-btn" aria-label="Следующий месяц" (click)="shiftMonth(1)">
            ›
          </button>
        </div>
      </div>
      <h2 class="month" aria-live="polite">{{ monthLabel() }}</h2>
      <div class="grid weekdays" aria-hidden="true">
        @for (d of weekdays; track d) {
          <span>{{ d }}</span>
        }
      </div>
      <ul class="grid days" [attr.aria-label]="monthLabel()">
        @for (gap of leadingGaps(); track $index) {
          <li aria-hidden="true"></li>
        }
        @for (cell of cells(); track cell.key) {
          <li>
            <button
              type="button"
              class="day"
              [class.today]="cell.today"
              [class.selected]="cell.selected"
              [disabled]="cell.past"
              [attr.aria-label]="cell.label"
              [attr.aria-pressed]="cell.selected"
              [attr.aria-current]="cell.today ? 'date' : null"
              (click)="store.date.set(cell.key)"
            >
              {{ cell.day }}
            </button>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .step { max-width: 520px; gap: 12px; }
    .head { display: flex; align-items: center; justify-content: space-between; }
    .nav { display: flex; gap: 6px; }
    .month { margin: 0; font-size: 18px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin: 0; padding: 0; list-style: none; }
    .weekdays { text-align: center; font-size: 13px; color: var(--muted); }
    .day {
      width: 100%; height: clamp(38px, 6.2vh, 52px); border: 0; border-radius: 14px;
      background: transparent; font-size: 17px; font-weight: 500; cursor: pointer;
    }
    .day:hover:not(:disabled):not(.selected) { background: var(--sand-hover); }
    .day.today { background: var(--sand); }
    .day.selected { background: var(--ink); color: var(--paper); }
    .day:disabled { opacity: 0.3; cursor: default; }
  `,
})
export class DateStep {
  protected readonly store = inject(BookingStore);
  protected readonly weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  protected readonly monthLabel = computed(() => {
    const { year, month } = this.store.month();
    return `${MONTHS[month]} ${year}`;
  });

  protected readonly canPrev = computed(() => {
    const { year, month } = this.store.month();
    return year * 100 + month > Math.floor(this.store.today / 100) - 1;
  });

  /** Пустые ячейки до первого числа: неделя начинается с понедельника. */
  protected readonly leadingGaps = computed(() => {
    const { year, month } = this.store.month();
    return Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 });
  });

  protected readonly cells = computed<DayCell[]>(() => {
    const { year, month } = this.store.month();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = this.store.today;
    const selected = this.store.date();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const key = year * 10000 + (month + 1) * 100 + i + 1;
      return {
        key,
        day: i + 1,
        label: formatDateLong(key),
        past: key < today,
        today: key === today,
        selected: key === selected,
      };
    });
  });

  protected shiftMonth(delta: number): void {
    this.store.month.update(({ year, month }) => {
      const total = year * 12 + month + delta;
      return { year: Math.floor(total / 12), month: total % 12 };
    });
  }
}
