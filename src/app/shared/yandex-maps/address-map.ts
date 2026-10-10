import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { YandexMapsLoader } from './yandex-maps-loader';
import { LatLng, YmapsMap } from './ymaps.types';

export type PinTone = 'start' | 'stop' | 'finish';

/**
 * Яндекс Карта с булавкой по центру: булавка стоит на месте, пользователь двигает карту.
 * Родитель задаёт `center`, а после перемещения карты пользователем получает `picked`.
 */
@Component({
  selector: 'app-address-map',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'address-map' },
  template: `
    <div
      #canvas
      class="canvas"
      role="region"
      aria-label="Карта. Передвиньте карту или нажмите на неё, чтобы указать точку"
    ></div>

    @if (status() !== 'ready') {
      <svg class="placeholder" viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="400" height="220" fill="#E4DECE" />
        <path d="M-10 160 C80 140 120 60 200 90 S330 150 410 40" stroke="#F6F3EC" stroke-width="14" fill="none" />
        <path d="M60 -10 L110 230" stroke="#F6F3EC" stroke-width="8" fill="none" />
        <path d="M250 -10 L300 230" stroke="#F6F3EC" stroke-width="8" fill="none" />
        <path d="M-10 40 L410 120" stroke="#F6F3EC" stroke-width="6" fill="none" />
        <rect x="130" y="110" width="50" height="36" rx="6" fill="#D2CBB8" />
        <rect x="320" y="140" width="46" height="50" rx="6" fill="#D2CBB8" />
        <rect x="20" y="70" width="46" height="30" rx="6" fill="#D2CBB8" />
      </svg>
      @if (status() === 'error') {
        <p class="note" role="status">Карта недоступна — введите адрес вручную</p>
      }
    }

    <div class="pin" [class.lifted]="moving()" aria-hidden="true">
      <span class="pin-head" [class]="'tone-' + pinTone()">{{ pinLetter() }}</span>
      <span class="pin-stem"></span>
    </div>

    @if (badge()) {
      <div class="badge">{{ badge() }}</div>
    }
  `,
  styleUrl: './address-map.css',
})
export class AddressMap {
  readonly center = input.required<LatLng>();
  readonly zoom = input(12);
  readonly pinLetter = input('A');
  readonly pinTone = input<PinTone>('start');
  readonly badge = input('');

  /** Пользователь остановил карту — под булавкой новая точка. */
  readonly picked = output<LatLng>();

  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly moving = signal(false);

  private readonly canvas = viewChild.required<ElementRef<HTMLElement>>('canvas');
  private map: YmapsMap | null = null;
  /** Перемещение запущено кодом, а не пользователем — не сообщаем о нём наружу. */
  private programmatic = false;
  private lastCenter: LatLng | null = null;

  constructor() {
    const loader = inject(YandexMapsLoader);
    let destroyed = false;

    afterNextRender(() => {
      loader.load().then(
        (ymaps) => {
          if (destroyed) return;
          const map = new ymaps.Map(
            this.canvas().nativeElement,
            { center: this.center(), zoom: this.zoom(), controls: ['zoomControl', 'geolocationControl'] },
            { suppressMapOpenBlock: true, autoFitToViewport: 'always' },
          );
          this.lastCenter = this.center();
          map.events.add('actionbegin', () => this.moving.set(!this.programmatic));
          map.events.add('actionend', () => this.onActionEnd(map));
          map.events.add('click', (e) => map.panTo(e.get('coords'), { duration: 250 }));
          this.map = map;
          this.status.set('ready');
        },
        () => {
          if (!destroyed) this.status.set('error');
        },
      );
    });

    effect(() => {
      const center = this.center();
      const zoom = this.zoom();
      if (this.status() === 'ready') untracked(() => this.flyTo(center, zoom));
    });

    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      this.map?.destroy();
      this.map = null;
    });
  }

  private onActionEnd(map: YmapsMap): void {
    this.moving.set(false);
    if (this.programmatic) return;
    const center = map.getCenter();
    if (this.lastCenter && isSamePoint(center, this.lastCenter)) return;
    this.lastCenter = center;
    this.picked.emit(center);
  }

  private flyTo(center: LatLng, zoom: number): void {
    const map = this.map;
    if (!map) return;
    this.lastCenter = center;
    if (isSamePoint(map.getCenter(), center) && map.getZoom() === zoom) return;
    this.programmatic = true;
    const done = () => (this.programmatic = false);
    map.setCenter(center, zoom, { duration: 300 }).then(done, done);
  }
}

function isSamePoint(a: LatLng, b: LatLng): boolean {
  return Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;
}
