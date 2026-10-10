import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Попутка — межгород от двери до двери',
    loadComponent: () => import('./booking/booking-page').then((m) => m.BookingPage),
  },
  { path: '**', redirectTo: '' },
];
