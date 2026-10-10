import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatDateShort } from '../booking.format';
import { BookingStore } from '../booking.store';

@Component({
  selector: 'app-done-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="done">
      <div class="check" aria-hidden="true">✓</div>
      <h1 data-step-title tabindex="-1">Поездка забронирована</h1>
      <p>{{ text() }}</p>
      <button type="button" class="btn btn-soft" (click)="store.reset()">Новая поездка</button>
    </section>
  `,
  styles: `
    :host { flex: 1; display: flex; width: 100%; justify-content: center; }
    .done {
      flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
      gap: 20px; max-width: 760px; padding: 0 clamp(20px, 6vw, 60px); text-align: center;
    }
    .check {
      display: flex; align-items: center; justify-content: center; width: 64px; height: 64px;
      border-radius: 50%; background: var(--success); color: #fff; font-size: 32px;
    }
    h1 { margin: 0; font-size: clamp(32px, 6vw, 56px); line-height: 1.05; letter-spacing: -0.03em; }
    p { margin: 0; max-width: 460px; font-size: 18px; line-height: 1.45; color: var(--muted); }
  `,
})
export class DoneStep {
  protected readonly store = inject(BookingStore);

  protected readonly text = computed(() => {
    const date = this.store.date();
    const car = this.store.car();
    if (!date || !car) return '';
    const pickup = this.store.points()[0];
    return (
      `${formatDateShort(date)} в ${car.time} водитель заберёт вас по адресу: ` +
      `${pickup?.city}, ${pickup?.address}. Подтверждение придёт на ${this.store.phone()}.`
    );
  });
}
