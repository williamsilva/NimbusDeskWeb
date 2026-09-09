import { Routes } from '@angular/router';

import { authGuard } from '@core/auth/auth.guard';
import { LayoutComponent } from '@layout/layout.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

      {
        path: 'dashboard',
        title: 'routes.dashboard.title',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },

      {
        path: 'tickets',
        loadChildren: () =>
          import('./features/tickets/tickets.routes').then((m) => m.TICKETS_ROUTES),
      },

      {
        path: 'security',
        loadChildren: () =>
          import('./features/security/security.routes').then((m) => m.SECURITY_ROUTES),
      },

      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },

      {
        path: 'forbidden',
        title: 'routes.forbidden.title',
        loadComponent: () =>
          import('./features/error/forbidden/forbidden.page').then((m) => m.ForbiddenPage),
      },

      {
        path: 'not-found',
        title: 'routes.notFound.title',
        loadComponent: () =>
          import('./features/error/not-found/not-found.page').then((m) => m.NotFoundPage),
      },

      {
        path: '**',
        title: 'routes.notFound.title',
        loadComponent: () =>
          import('./features/error/not-found/not-found.page').then((m) => m.NotFoundPage),
      },
    ],
  },
];
