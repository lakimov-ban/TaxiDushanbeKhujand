import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { CITIES } from '../booking.data';
import { BookingStore } from '../booking.store';

@Component({
  selector: 'app-cities-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="step">
      <h1 class="step-title" data-step-title tabindex="-1">{{ title() }}</h1>

      @if (store.route().length) {
        <p class="route">{{ routeText() }}</p>
      }

      @if (showPicker()) {
        <label class="visually-hidden" for="city-search">Найти город</label>
        <div class="field">
          <input
            #search
            id="city-search"
            type="search"
            data-autofocus
            autocomplete="off"
            placeholder="Найти город"
            [value]="store.cityQuery()"
            (input)="store.cityQuery.set(search.value)"
          />
        </div>
        <ul class="tiles" aria-label="Города">
          @for (city of tiles(); track city) {
            <li>
              <button type="button" class="tile" (click)="pick(city)">{{ city }}</button>
            </li>
          } @empty {
            <li class="muted">Город не найден</li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .step { max-width: 760px; }
    .route { margin: 0; font-size: 17px; font-weight: 600; }
    .tiles {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 140px), 1fr));
      gap: 8px; margin: 0; padding: 0; list-style: none;
    }
    .tile {
      width: 100%; padding: 16px; border: 0; border-radius: 18px; background: var(--card);
      font-size: 18px; font-weight: 600; text-align: left; cursor: pointer;
    }
    .tile:hover { background: var(--accent); }
  `,
})
export class CitiesStep {
  protected readonly store = inject(BookingStore);
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private readonly stage = computed(() => {
    const n = this.store.route().length;
    return n === 0 ? 'from' : n === 1 ? 'to' : 'done';
  });

  protected readonly title = computed(
    () =>
      ({
        from: 'Откуда едем?',
        to: 'Куда едем?',
        done: 'Маршрут',
      })[this.stage()],
  );
  protected readonly routeText = computed(() => this.store.route().join('  →  '));
  protected readonly showPicker = computed(() => this.stage() !== 'done');

  protected readonly tiles = computed(() => {
    const used = this.store.route();
    const q = this.store.cityQuery().trim().toLowerCase();
    return CITIES.map((c) => c.name).filter((c) => !used.includes(c) && c.toLowerCase().includes(q));
  });

  protected pick(city: string): void {
    this.store.pickCity(city);
    this.restoreFocus();
  }

  /** Нажатая кнопка исчезла вместе с фокусом — возвращаем его в поиск или к заголовку. */
  private restoreFocus(): void {
    afterNextRender(
      () => {
        const target =
          this.search()?.nativeElement ??
          this.host.nativeElement.querySelector<HTMLElement>('[data-step-title]');
        target?.focus();
      },
      { injector: this.injector },
    );
  }
}
