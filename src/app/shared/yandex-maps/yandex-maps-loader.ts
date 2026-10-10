import { DOCUMENT, Injectable, inject } from '@angular/core';
import { YANDEX_MAPS_CONFIG } from './yandex-maps.config';
import { Ymaps } from './ymaps.types';

/** Лениво подключает скрипт JS API Яндекс Карт 2.1 один раз на всё приложение. */
@Injectable({ providedIn: 'root' })
export class YandexMapsLoader {
  private readonly config = inject(YANDEX_MAPS_CONFIG);
  private readonly document = inject(DOCUMENT);
  private pending: Promise<Ymaps> | null = null;

  load(): Promise<Ymaps> {
    this.pending ??= this.inject().catch((error: unknown) => {
      // Даём шанс повторить загрузку, например после восстановления сети.
      this.pending = null;
      throw error;
    });
    return this.pending;
  }

  private inject(): Promise<Ymaps> {
    const view = this.document.defaultView;
    if (!view) return Promise.reject(new Error('Яндекс Карты доступны только в браузере'));

    return new Promise<Ymaps>((resolve, reject) => {
      const whenReady = () => {
        const ymaps = view.ymaps;
        if (!ymaps) return reject(new Error('Скрипт Яндекс Карт загрузился без объекта ymaps'));
        ymaps.ready(() => resolve(ymaps), reject);
      };
      if (view.ymaps) return whenReady();

      const params = new URLSearchParams({ lang: this.config.lang });
      if (this.config.apiKey) params.set('apikey', this.config.apiKey);

      const script = this.document.createElement('script');
      script.src = `https://api-maps.yandex.ru/2.1/?${params}`;
      script.async = true;
      script.onload = whenReady;
      script.onerror = () => {
        script.remove();
        reject(new Error('Не удалось загрузить Яндекс Карты'));
      };
      this.document.head.appendChild(script);
    });
  }
}
