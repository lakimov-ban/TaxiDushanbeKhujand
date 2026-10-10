import { InjectionToken, Provider } from '@angular/core';

/** Ключи выдаются в кабинете разработчика: https://developer.tech.yandex.ru/services */
export interface YandexMapsConfig {
  /** Ключ продукта «JavaScript API» — для отображения карты. */
  apiKey: string;
  /** Ключ продукта «API Геокодера» — для поиска адресов. */
  geocoderApiKey: string;
  lang: string;
}

const DEFAULTS: YandexMapsConfig = { apiKey: '', geocoderApiKey: '', lang: 'ru_RU' };

export const YANDEX_MAPS_CONFIG = new InjectionToken<YandexMapsConfig>('YANDEX_MAPS_CONFIG', {
  factory: () => DEFAULTS,
});

export function provideYandexMaps(config: Partial<YandexMapsConfig>): Provider {
  return { provide: YANDEX_MAPS_CONFIG, useValue: { ...DEFAULTS, ...config } };
}
