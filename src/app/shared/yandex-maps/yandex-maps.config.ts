import { InjectionToken, Provider } from '@angular/core';

export interface YandexMapsConfig {
  /** Ключ «JavaScript API и HTTP Геокодер» из кабинета разработчика: https://developer.tech.yandex.ru/ */
  apiKey: string;
  lang: string;
}

export const YANDEX_MAPS_CONFIG = new InjectionToken<YandexMapsConfig>('YANDEX_MAPS_CONFIG', {
  factory: () => ({ apiKey: '', lang: 'ru_RU' }),
});

export function provideYandexMaps(config: Partial<YandexMapsConfig>): Provider {
  return { provide: YANDEX_MAPS_CONFIG, useValue: { apiKey: '', lang: 'ru_RU', ...config } };
}
