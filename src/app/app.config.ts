import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideYandexMaps } from './shared/yandex-maps/yandex-maps.config';

/**
 * Ключ «JavaScript API и HTTP Геокодер»: https://developer.tech.yandex.ru/services
 * Без ключа Яндекс не отвечает на запросы геокодера, и поиск адреса не работает.
 */
const YANDEX_MAPS_API_KEY = 'a85971a5-6078-4742-90f6-a26c65247e34';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideYandexMaps({ apiKey: YANDEX_MAPS_API_KEY }),
  ],
};
