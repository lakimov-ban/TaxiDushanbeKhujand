import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideYandexMaps } from './shared/yandex-maps/yandex-maps.config';

/**
 * Ключи Яндекса: https://developer.tech.yandex.ru/services
 * - «JavaScript API» — карта. Без ключа карта показывается, но с ограничениями.
 * - «API Геокодера» — поиск адресов. Без него поиск не работает.
 */
const YANDEX_MAPS_API_KEY = '';
const YANDEX_GEOCODER_API_KEY = 'a85971a5-6078-4742-90f6-a26c65247e34';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideYandexMaps({ apiKey: YANDEX_MAPS_API_KEY, geocoderApiKey: YANDEX_GEOCODER_API_KEY }),
  ],
};
