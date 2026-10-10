import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BookingStore } from '../booking.store';

@Component({
  selector: 'app-welcome-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="welcome">
      <div class="route-mark" aria-hidden="true">
        <span class="dot dot-start"></span>
        <span class="line"></span>
        <span class="dot dot-mid"></span>
        <span class="line"></span>
        <span class="dot dot-end"></span>
      </div>
      <h1 data-step-title tabindex="-1">Межгород от двери до двери</h1>
      <p>Заберём от дома, довезём до адреса. Эконом или комфорт, с остановками в городах по пути.</p>
      <button type="button" class="btn btn-dark btn-lg" (click)="store.start()">Начать</button>
    </section>
  `,
  styles: `
    :host { flex: 1; display: flex; width: 100%; justify-content: center; }
    .welcome {
      flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
      gap: 28px; padding: 0 clamp(20px, 6vw, 60px); max-width: 760px; text-align: center;
    }
    h1 {
      margin: 0; font-size: clamp(36px, 7vw, 68px); line-height: 1.02;
      letter-spacing: -0.035em; font-weight: 700; text-wrap: balance;
    }
    p { margin: 0; max-width: 460px; font-size: clamp(16px, 2vw, 20px); line-height: 1.45; color: var(--muted); text-wrap: pretty; }
    .route-mark { display: flex; align-items: center; gap: 8px; }
    .dot { border-radius: 50%; }
    .dot-start { width: 14px; height: 14px; background: var(--ink); }
    .dot-mid { width: 10px; height: 10px; background: var(--ink); opacity: 0.4; }
    .dot-end { width: 14px; height: 14px; background: var(--accent); }
    .line { width: clamp(30px, 8vw, 80px); height: 3px; background: var(--ink); opacity: 0.2; }
  `,
})
export class WelcomeStep {
  protected readonly store = inject(BookingStore);
}
