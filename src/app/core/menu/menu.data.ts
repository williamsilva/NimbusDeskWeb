import { environment } from 'environments/environment';

import { APP_KEY } from '@core/api/api.config';
import { PERMISSIONS } from '@core/auth/permissions.constants';

import { AppMenuItem } from './menu.model';

export const APP_MENU: AppMenuItem[] = [
  {
    icon: 'pi pi-home text-blue-600',
    labelKey: 'menu.dashboard',
    route: '/dashboard',
    exact: true,
  },
  /* Chamados de TI — cor teal (sem gate de permissão: todo autenticado pode abrir/ver os
   *  próprios chamados, ver PROJECT_SPEC.md) */
  {
    icon: 'pi pi-ticket text-teal-600',
    labelKey: 'menu.tickets',
    route: '/tickets',
    exact: false,
  },
  /* Security — cor vermelha */
  {
    icon: 'pi pi-shield text-red-600',
    labelKey: 'menu.security.title',
    children: [
      {
        labelKey: 'menu.security.users',
        icon: 'pi pi-user text-red-400',
        externalUrl: `${environment.nimbusAuthWebUrl}/users?appKey=${APP_KEY}`,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.USERS.VIEW],
      },
      {
        labelKey: 'menu.security.groups',
        icon: 'pi pi-id-card text-red-400',
        externalUrl: `${environment.nimbusAuthWebUrl}/groups?appKey=${APP_KEY}`,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.GROUPS.VIEW],
      },
    ],
  },
  /* Settings — cor indigo */
  {
    icon: 'pi pi-cog text-indigo-600',
    labelKey: 'menu.settings.title',
    children: [
      {
        labelKey: 'menu.settings.email',
        icon: 'pi pi-envelope text-indigo-400',
        externalUrl: `${environment.nimbusAuthWebUrl}/apps-email-settings?appKey=${APP_KEY}`,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_VIEW],
      },
      {
        labelKey: 'menu.settings.backup',
        icon: 'pi pi-database text-indigo-400',
        externalUrl: `${environment.nimbusAuthWebUrl}/backup`,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.BACKUP_PROCESS],
      },
      {
        labelKey: 'menu.settings.emailLog',
        icon: 'pi pi-history text-indigo-400',
        externalUrl: `${environment.nimbusAuthWebUrl}/apps-email-log?appKey=${APP_KEY}`,
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETTINGS.EMAIL_LOG_VIEW],
      },
      {
        exact: false,
        route: '/settings/categorias',
        labelKey: 'menu.settings.categorias',
        icon: 'pi pi-tags text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.CATEGORIA.VIEW],
      },
      {
        exact: false,
        route: '/settings/slas',
        labelKey: 'menu.settings.slas',
        icon: 'pi pi-stopwatch text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SLA.VIEW],
      },
      {
        exact: false,
        route: '/settings/setores-ti',
        labelKey: 'menu.settings.setoresTi',
        icon: 'pi pi-sitemap text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.SETOR_TI.VIEW],
      },
      {
        exact: false,
        route: '/settings/ticket-automation',
        labelKey: 'menu.settings.ticketAutomation',
        icon: 'pi pi-bolt text-indigo-400',
        permissions: [PERMISSIONS.SUPPORT, PERMISSIONS.TICKET_AUTOMATION.VIEW],
      },
    ],
  },
];
