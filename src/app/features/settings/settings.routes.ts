import { Routes } from '@angular/router';

import { permissionGuard } from '@core/auth/permission.guard';
import { PERMISSIONS } from '@core/auth/permissions.constants';

export const SETTINGS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'email-log' },
  {
    path: 'email-log',
    title: 'routes.settings.emailLog.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_LOG_VIEW],
    },
    loadComponent: () =>
      import('./email-log/email-log-list.component').then(
        (m) => m.EmailLogListComponent,
      ),
  },
  {
    path: 'categorias',
    title: 'routes.settings.categorias.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.CATEGORIA.VIEW],
    },
    loadComponent: () =>
      import('./categorias/categorias-list.component').then((m) => m.CategoriasListComponent),
  },
  {
    path: 'slas',
    title: 'routes.settings.slas.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SLA.VIEW],
    },
    loadComponent: () => import('./slas/slas-list.component').then((m) => m.SlasListComponent),
  },
  {
    path: 'setores-ti',
    title: 'routes.settings.setoresTi.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETOR_TI.VIEW],
    },
    loadComponent: () =>
      import('./setores-ti/setores-ti-list.component').then((m) => m.SetoresTiListComponent),
  },
  {
    path: 'ticket-automation',
    title: 'routes.settings.ticketAutomation.title',
    canActivate: [permissionGuard],
    data: {
      requireAll: false,
      redirectTo: '/forbidden',
      permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TICKET_AUTOMATION.VIEW],
    },
    loadComponent: () =>
      import('./ticket-automation-settings/ticket-automation-settings.component').then(
        (m) => m.TicketAutomationSettingsComponent,
      ),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
