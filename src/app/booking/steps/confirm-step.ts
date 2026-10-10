import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatDateShort, formatMoney, plural } from '../booking.format';
import { BookingStore } from '../booking.store';

@Component({
  selector: 'app-confirm-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step">
      <h1 class="step-title" data-step-title tabindex="-1">Подтверждение</h1>

      <div class="card summary">
        <p class="route">{{ routeLine() }}</p>
        <p class="addresses muted">{{ addressLine() }}</p>
        <dl>
          <div><dt>Выезд</dt><dd>{{ whenLine() }}</dd></div>
          <div><dt>Машина</dt><dd>{{ carLine() }}</dd></div>
          <div><dt>Пассажиры</dt><dd>{{ passengersLine() }}</dd></div>
          <div><dt>Багаж</dt><dd>{{ store.luggageName() }}</dd></div>
          <div class="total"><dt>К оплате</dt><dd>{{ totalLine() }}</dd></div>
        </dl>
      </div>

      <div class="contacts">
        <label class="visually-hidden" for="contact-name">Имя</label>
        <div class="field">
          <input
            #nameInput
            id="contact-name"
            type="text"
            autocomplete="name"
            placeholder="Имя"
            [value]="store.name()"
            (input)="store.name.set(nameInput.value)"
          />
        </div>
        <label class="visually-hidden" for="contact-phone">Телефон</label>
        <div class="field">
          <input
            #phoneInput
            id="contact-phone"
            type="tel"
            autocomplete="tel"
            inputmode="tel"
            placeholder="+992 ___ __ __ __"
            [value]="store.phone()"
            (input)="store.phone.set(phoneInput.value)"
          />
        </div>
      </div>
      <p class="note muted">Оплата водителю по приезде. Бесплатная отмена за 2 часа до выезда.</p>
    </section>
  `,
  styles: `
    .step { max-width: 560px; gap: 14px; justify-content: safe center; }
    .summary { display: flex; flex-direction: column; gap: 10px; padding: 18px; }
    .route { margin: 0; font-size: 17px; font-weight: 600; line-height: 1.35; }
    .addresses { margin: 0; font-size: 14px; line-height: 1.5; }
    dl { display: flex; flex-direction: column; gap: 10px; margin: 0; }
    dl > div { display: flex; justify-content: space-between; gap: 12px; font-size: 15px; }
    dt { color: var(--muted); }
    dd { margin: 0; font-weight: 600; text-align: right; }
    .total { align-items: baseline; margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--line); }
    .total dt { font-size: 16px; font-weight: 600; color: var(--ink); }
    .total dd { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; }
    .contacts { display: flex; flex-wrap: wrap; gap: 8px; }
    .contacts .field { flex: 1 1 200px; }
    .note { margin: 0; font-size: 13px; }
  `,
})
export class ConfirmStep {
  protected readonly store = inject(BookingStore);

  protected readonly routeLine = computed(() => this.store.route().join(' → '));
  protected readonly addressLine = computed(() =>
    this.store
      .points()
      .map((p) => `${p.city}, ${p.address}`)
      .join(' → '),
  );
  protected readonly whenLine = computed(() => {
    const date = this.store.date();
    const car = this.store.car();
    return date && car ? `${formatDateShort(date)}, ${car.time}` : '';
  });
  protected readonly carLine = computed(() => {
    const car = this.store.car();
    return car ? `${car.model} · ${car.comfort ? 'Комфорт' : 'Эконом'}` : '';
  });
  protected readonly passengersLine = computed(() => {
    const adults = plural(this.store.adults(), 'взрослый', 'взрослых', 'взрослых');
    const kids = this.store.kids();
    return kids ? `${adults}, ${plural(kids, 'ребёнок', 'ребёнка', 'детей')}` : adults;
  });
  protected readonly totalLine = computed(() => formatMoney(this.store.total()));
}
