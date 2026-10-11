import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, from, map, of, switchMap } from 'rxjs';
import { AddressMap, PinTone } from '../../shared/yandex-maps/address-map';
import { AddressSuggestion, Geocoder } from '../../shared/yandex-maps/geocoder';
import { LatLng } from '../../shared/yandex-maps/ymaps.types';
import { CITIES, POPULAR_STREETS, findCity } from '../booking.data';
import { BookingStore } from '../booking.store';

const MIN_QUERY_LENGTH = 3;
const CITY_ZOOM = 12;
const ADDRESS_ZOOM = 17;
const NOT_FOUND = 'Адрес не найден. Уточните улицу или передвиньте карту';
const UNAVAILABLE = 'Поиск адреса сейчас недоступен — введите адрес вручную';

@Component({
  selector: 'app-address-step',
  imports: [AddressMap],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './address-step.html',
  styleUrl: './address-step.css',
})
export class AddressStep {
  protected readonly store = inject(BookingStore);
  private readonly geocoder = inject(Geocoder);

  protected readonly suggestions = signal<AddressSuggestion[]>([]);
  protected readonly activeIndex = signal(-1);
  protected readonly searching = signal(false);
  /** Объявления только для экранных дикторов. */
  protected readonly status = signal('');
  /** Видимое сообщение под полем: адрес не найден или поиск недоступен. */
  protected readonly notice = signal('');
  protected readonly popularStreets = POPULAR_STREETS;

  private readonly queries = new Subject<string>();
  /** Отбрасывает ответы геокодера, пришедшие после более свежего действия пользователя. */
  private requestId = 0;

  protected readonly index = this.store.pointIndex;
  protected readonly point = computed(() => this.store.currentPoint() ?? { city: '', address: '', coords: null });
  private readonly isFirst = computed(() => this.index() === 0);
  private readonly cityCenter = computed(() => (findCity(this.point().city) ?? CITIES[0]).center);

  protected readonly title = computed(() =>
    this.isFirst() ? 'Откуда вас забрать?' : 'Куда вас отвезти?',
  );
  protected readonly placeholder = computed(() =>
    this.isFirst() ? 'Улица и дом посадки' : 'Улица и дом высадки',
  );
  protected readonly doneText = computed(() =>
    this.store
      .points()
      .slice(0, this.index())
      .map((p) => `Посадка: ${p.city}, ${p.address}`)
      .join(' · '),
  );

  /**
   * Что показывает карта. Сбрасывается при переходе к другой точке маршрута,
   * а при наборе текста остаётся на месте — карта не прыгает на каждую букву.
   */
  protected readonly view = linkedSignal<number, { center: LatLng; zoom: number }>({
    source: this.index,
    computation: () =>
      untracked(() => {
        const coords = this.point().coords;
        return coords ? { center: coords, zoom: ADDRESS_ZOOM } : { center: this.cityCenter(), zoom: CITY_ZOOM };
      }),
  });
  protected readonly pinLetter = computed(() => String.fromCharCode(65 + this.index()));
  protected readonly pinTone = computed<PinTone>(() => (this.isFirst() ? 'start' : 'finish'));
  protected readonly badge = computed(
    () =>
      `Точка ${this.index() + 1} из ${this.store.points().length} · ${this.point().city}` +
      (this.isFirst() ? ' · от двери' : ''),
  );
  protected readonly listOpen = computed(() => this.suggestions().length > 0);
  protected readonly activeOptionId = computed(() =>
    this.activeIndex() >= 0 ? `addr-option-${this.activeIndex()}` : null,
  );

  constructor() {
    this.queries
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < MIN_QUERY_LENGTH) return of(null);
          const id = ++this.requestId;
          this.searching.set(true);
          return from(this.find(query)).pipe(
            catchError(() => of('error' as const)),
            map((found) => (id === this.requestId ? found : null)),
            finalize(() => {
              if (id === this.requestId) this.searching.set(false);
            }),
          );
        }),
      )
      .subscribe((found) => {
        if (found === 'error') this.showError();
        else if (found !== null) this.showSuggestions(found);
      });
    inject(DestroyRef).onDestroy(() => this.queries.complete());

    // Переход к следующей точке маршрута — старые подсказки больше не нужны.
    effect(() => {
      this.index();
      untracked(() => {
        this.cancelSearch();
        this.closeSuggestions();
        this.status.set('');
        this.notice.set('');
      });
    });
  }

  protected onInput(value: string): void {
    this.store.setPoint(this.index(), { address: value, coords: null });
    this.notice.set('');
    if (value.trim().length < MIN_QUERY_LENGTH) this.closeSuggestions();
    this.queries.next(value.trim());
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.suggestions().length;
    switch (event.key) {
      case 'ArrowDown':
        if (!count) return;
        event.preventDefault();
        this.activeIndex.update((i) => (i + 1) % count);
        break;
      case 'ArrowUp':
        if (!count) return;
        event.preventDefault();
        this.activeIndex.update((i) => (i <= 0 ? count - 1 : i - 1));
        break;
      case 'Escape':
        if (count) {
          event.preventDefault();
          this.closeSuggestions();
        }
        break;
      case 'Enter': {
        event.preventDefault();
        const chosen = this.suggestions()[Math.max(0, this.activeIndex())];
        if (chosen) this.pick(chosen);
        else void this.searchNow(this.point().address);
        break;
      }
    }
  }

  protected pick(suggestion: AddressSuggestion): void {
    this.cancelSearch();
    this.store.setPoint(this.index(), { address: suggestion.title, coords: suggestion.coords });
    this.view.set({ center: suggestion.coords, zoom: ADDRESS_ZOOM });
    this.closeSuggestions();
    this.notice.set('');
    this.status.set(`Выбран адрес: ${suggestion.title}`);
  }

  protected closeOnBlur(): void {
    this.closeSuggestions();
  }

  /** Быстрая подсказка: показываем улицу на карте, если геокодер её найдёт. */
  protected pickPopular(street: string): void {
    this.store.setPoint(this.index(), { address: street, coords: null });
    void this.searchNow(street);
  }

  protected async onMapPicked(coords: LatLng): Promise<void> {
    const index = this.index();
    this.cancelSearch();
    const id = this.requestId;
    this.closeSuggestions();
    this.store.setPoint(index, { coords });
    try {
      const found = await this.geocoder.reverse(coords);
      if (id !== this.requestId || !found) return;
      this.store.setPoint(index, { address: found.title });
      this.notice.set('');
      this.status.set(`Точка на карте: ${found.title}`);
    } catch {
      if (id === this.requestId) this.showError();
    }
  }

  private async searchNow(query: string): Promise<void> {
    if (query.trim().length < MIN_QUERY_LENGTH) return;
    this.cancelSearch();
    const id = this.requestId;
    this.searching.set(true);
    try {
      const found = await this.find(query.trim());
      if (id !== this.requestId) return;
      if (found.length) this.pick(found[0]);
      else this.showSuggestions([]);
    } catch {
      if (id === this.requestId) this.showError();
    } finally {
      if (id === this.requestId) this.searching.set(false);
    }
  }

  private find(query: string): Promise<AddressSuggestion[]> {
    return this.geocoder.search(query, this.point().city, this.cityCenter());
  }

  private showSuggestions(found: AddressSuggestion[]): void {
    this.suggestions.set(found);
    this.activeIndex.set(-1);
    this.notice.set(found.length ? '' : NOT_FOUND);
    this.status.set(found.length ? `Найдено адресов: ${found.length}. Выберите стрелками и нажмите Enter` : '');
  }

  private showError(): void {
    this.closeSuggestions();
    this.notice.set(UNAVAILABLE);
  }

  /** Отменяет и отложенный (debounce), и уже отправленный поиск. */
  private cancelSearch(): void {
    this.requestId++;
    this.queries.next('');
    this.searching.set(false);
  }

  private closeSuggestions(): void {
    this.suggestions.set([]);
    this.activeIndex.set(-1);
  }
}
