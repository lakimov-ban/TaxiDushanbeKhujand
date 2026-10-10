import { Injectable, inject } from '@angular/core';
import { YandexMapsLoader } from './yandex-maps-loader';
import { LatLng, YmapsGeoObject } from './ymaps.types';

export interface AddressSuggestion {
  /** Короткий адрес: «проспект Рудаки, 12». */
  title: string;
  /** Уточнение: город, страна. */
  subtitle: string;
  coords: LatLng;
}

/** Слишком крупные объекты, которые геокодер возвращает, когда не нашёл улицу. */
const COARSE_KINDS = new Set(['country', 'province', 'area', 'locality']);
const KIND_PATH = 'metaDataProperty.GeocoderMetaData.kind';

/** Поиск адресов через геокодер Яндекс Карт. */
@Injectable({ providedIn: 'root' })
export class Geocoder {
  private readonly loader = inject(YandexMapsLoader);

  /** Ищет адреса внутри города; `center` ограничивает выдачу окрестностями города. */
  async search(query: string, city: string, center: LatLng): Promise<AddressSuggestion[]> {
    const ymaps = await this.loader.load();
    const [lat, lng] = center;
    const res = await ymaps.geocode(`Таджикистан, ${city}, ${query}`, {
      results: 6,
      boundedBy: [
        [lat - 0.15, lng - 0.2],
        [lat + 0.15, lng + 0.2],
      ],
      strictBounds: true,
    });
    const out: AddressSuggestion[] = [];
    for (let i = 0; i < res.geoObjects.getLength(); i++) {
      const obj = res.geoObjects.get(i);
      if (COARSE_KINDS.has(String(obj.properties.get(KIND_PATH)))) continue;
      const suggestion = toSuggestion(obj);
      if (suggestion) out.push(suggestion);
    }
    return out;
  }

  /** Обратное геокодирование: ближайший адрес к точке на карте. */
  async reverse(coords: LatLng): Promise<AddressSuggestion | null> {
    const ymaps = await this.loader.load();
    const res = await ymaps.geocode(coords, { results: 1 });
    return res.geoObjects.getLength() ? toSuggestion(res.geoObjects.get(0)) : null;
  }
}

function toSuggestion(obj: YmapsGeoObject): AddressSuggestion | null {
  const coords = obj.geometry?.getCoordinates();
  const title = obj.properties.get('name');
  if (!coords || typeof title !== 'string') return null;
  const subtitle = obj.properties.get('description');
  return { title, subtitle: typeof subtitle === 'string' ? subtitle : '', coords };
}
