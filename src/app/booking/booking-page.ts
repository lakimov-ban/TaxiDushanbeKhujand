import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
} from '@angular/core';
import { BookingStore } from './booking.store';
import { AddressStep } from './steps/address-step';
import { CarsStep } from './steps/cars-step';
import { CitiesStep } from './steps/cities-step';
import { ConfirmStep } from './steps/confirm-step';
import { DateStep } from './steps/date-step';
import { DoneStep } from './steps/done-step';
import { PassengersStep } from './steps/passengers-step';
import { WelcomeStep } from './steps/welcome-step';

@Component({
  selector: 'app-booking-page',
  imports: [WelcomeStep, CitiesStep, AddressStep, DateStep, PassengersStep, CarsStep, ConfirmStep, DoneStep],
  providers: [BookingStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.css',
})
export class BookingPage {
  protected readonly store = inject(BookingStore);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    let firstRun = true;

    // При смене шага переносим фокус на новый экран, чтобы клавиатура и
    // экранные дикторы не оставались на исчезнувшей кнопке.
    afterRenderEffect(() => {
      this.store.step();
      this.store.pointIndex();
      if (firstRun) {
        firstRun = false;
        return;
      }
      const main = host.nativeElement.querySelector('main');
      const target =
        main?.querySelector<HTMLElement>('[data-autofocus]') ??
        main?.querySelector<HTMLElement>('[data-step-title]');
      target?.focus({ preventScroll: true });
    });
  }
}
