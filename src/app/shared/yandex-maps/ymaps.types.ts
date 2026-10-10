/** [широта, долгота] — порядок координат по умолчанию в JS API Яндекс Карт 2.1. */
export type LatLng = [number, number];

/** Минимальное подмножество типов JS API Яндекс Карт 2.1, которое использует приложение. */
export interface YmapsEvent {
  get(name: 'coords'): LatLng;
}

export interface YmapsEventManager {
  add(type: string, callback: (event: YmapsEvent) => void): void;
}

export interface YmapsMap {
  readonly events: YmapsEventManager;
  getCenter(): LatLng;
  getZoom(): number;
  setCenter(center: LatLng, zoom?: number, options?: { duration?: number }): PromiseLike<void>;
  panTo(center: LatLng, options?: { flying?: boolean; duration?: number }): PromiseLike<void>;
  destroy(): void;
}

export interface YmapsMapState {
  center: LatLng;
  zoom: number;
  controls?: string[];
}

export interface Ymaps {
  ready(onReady: () => void, onError?: (error: unknown) => void): void;
  Map: new (
    element: HTMLElement,
    state: YmapsMapState,
    options?: Record<string, unknown>,
  ) => YmapsMap;
}

declare global {
  interface Window {
    ymaps?: Ymaps;
  }
}
