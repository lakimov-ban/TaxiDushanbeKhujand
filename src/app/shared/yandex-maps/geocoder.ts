import { Injectable, inject } from '@angular/core';
import { YANDEX_MAPS_CONFIG } from './yandex-maps.config';
import { LatLng } from './ymaps.types';

export interface AddressSuggestion {
  /** Короткий адрес: «проспект Рудаки, 12». */
  title: string;
  /** Уточнение: город, страна. */
  subtitle: string;
  coords: LatLng;
}

/** Ответ HTTP Геокодера (format=json) — только используемые поля. */
interface GeocoderResponse {
  response: {
    GeoObjectCollection: {
      featureMember: {
        GeoObject: {
          name?: string;
          description?: string;
          Point?: { pos?: string };
          metaDataProperty?: { GeocoderMetaData?: { kind?: string } };
        };
      }[];
    };
  };
}

const ENDPOINT = 'https://geocode-maps.yandex.ru/1.x/';
/** Слишком крупные объекты, которые геокодер возвращает, когда не нашёл улицу. */
const COARSE_KINDS = new Set(['country', 'province', 'area', 'locality']);

/** Поиск адресов через HTTP Геокодер Яндекса. */
@Injectable({ providedIn: 'root' })
export class Geocoder {
  private readonly config = inject(YANDEX_MAPS_CONFIG);

  /** Ищет адреса внутри города; `center` ограничивает выдачу окрестностями города. */
  async search(query: string, city: string, center: LatLng): Promise<AddressSuggestion[]> {
    const [lat, lng] = center;
    const found = await this.request({
      geocode: `Таджикистан, ${city}, ${query}`,
      results: '6',
      // В HTTP Геокодере координаты идут в порядке «долгота, широта».
      bbox: `${lng - 0.2},${lat - 0.15}~${lng + 0.2},${lat + 0.15}`,
      rspn: '1',
    });
    return found.filter((s) => !COARSE_KINDS.has(s.kind)).map(({ kind: _, ...s }) => s);
  }

  /** Обратное геокодирование: ближайший адрес к точке на карте. */
  async reverse([lat, lng]: LatLng): Promise<AddressSuggestion | null> {
    // kind=house — иначе для точки посреди квартала вернётся район, а не адрес.
    const [first] = await this.request({ geocode: `${lng},${lat}`, kind: 'house', results: '1' });
    if (!first) return null;
    const { kind: _, ...suggestion } = first;
    return suggestion;
  }

  private async request(params: Record<string, string>): Promise<(AddressSuggestion & { kind: string })[]> {
    const url = new URL(ENDPOINT);
    url.search = new URLSearchParams({
      apikey: this.config.geocoderApiKey,
      format: 'json',
      lang: this.config.lang,
      ...params,
    }).toString();

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Геокодер ответил ${res.status}`);
    const body = (await res.json()) as GeocoderResponse;

    return body.response.GeoObjectCollection.featureMember.flatMap(({ GeoObject: obj }) => {
      const [lng, lat] = (obj.Point?.pos ?? '').split(' ').map(Number);
      if (!obj.name || !Number.isFinite(lat) || !Number.isFinite(lng)) return [];
      return [
        {
          title: obj.name,
          subtitle: obj.description ?? '',
          coords: [lat, lng] as LatLng,
          kind: obj.metaDataProperty?.GeocoderMetaData?.kind ?? '',
        },
      ];
    });
  }
}
