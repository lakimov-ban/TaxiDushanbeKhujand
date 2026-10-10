import { TestBed } from '@angular/core/testing';
import { BookingStore } from './booking.store';

describe('BookingStore', () => {
  let store: BookingStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [BookingStore] });
    store = TestBed.inject(BookingStore);
    store.start();
  });

  it('builds a route and inserts a via city before the destination', () => {
    store.pickCity('Душанбе');
    expect(store.canNext()).toBe(false);
    store.pickCity('Худжанд');
    expect(store.canNext()).toBe(true);

    store.startVia();
    expect(store.canNext()).toBe(false);
    store.pickCity('Истаравшан');

    expect(store.route()).toEqual(['Душанбе', 'Истаравшан', 'Худжанд']);
    expect(store.canNext()).toBe(true);
  });

  it('walks through every route point on the address step', () => {
    store.pickCity('Душанбе');
    store.pickCity('Худжанд');
    store.next();

    expect(store.step()).toBe('address');
    expect(store.points().map((p) => p.city)).toEqual(['Душанбе', 'Худжанд']);
    expect(store.canNext()).toBe(false);

    store.setPoint(0, { address: 'пр. Рудаки, 12', coords: [38.57, 68.78] });
    store.next();
    expect(store.pointIndex()).toBe(1);

    store.setPoint(1, { address: 'ул. Ленина, 1' });
    store.next();
    expect(store.step()).toBe('date');

    store.back();
    expect(store.step()).toBe('address');
  });

  it('keeps entered addresses when the route is unchanged', () => {
    store.pickCity('Душанбе');
    store.pickCity('Худжанд');
    store.next();
    store.setPoint(0, { address: 'пр. Рудаки, 12' });
    store.back();
    store.next();

    expect(store.points()[0].address).toBe('пр. Рудаки, 12');
  });

  it('prices comfort higher and counts kids at a discount', () => {
    store.pickCity('Душанбе');
    store.pickCity('Худжанд');
    const economy = { time: '08:00', model: 'Kia Rio', comfort: false, seatsLeft: 4 };
    const comfort = { ...economy, comfort: true };

    expect(store.priceFor(economy)).toEqual({ total: 150, perSeat: 150 });
    expect(store.priceFor(comfort).total).toBe(240);

    store.kids.set(1);
    expect(store.priceFor(economy).total).toBe(255);
  });

  it('requires name and a full phone number to confirm', () => {
    store.step.set('confirm');
    store.name.set('Али');
    store.phone.set('+992 90');
    expect(store.canNext()).toBe(false);
    store.phone.set('+992 90 123 45 67');
    expect(store.canNext()).toBe(true);
  });
});
