import { Routes } from '@angular/router';

/**
 * Sem gate de permissão em nenhuma rota aqui - "ver a própria lista"/"abrir chamado"/"ver o
 * próprio chamado" são livres pra todo autenticado (ver PROJECT_SPEC.md e
 * TicketsPermissionPolicy). O toggle "Meus chamados"/"Todos" dentro da lista e as ações de gestão
 * dentro do detalhe é que ficam condicionadas a CHAMADO_CONSULT/CHAMADO_MANAGE.
 *
 * Criação é diálogo modal aberto a partir da lista (TicketsCreateDialogComponent, mesmo padrão de
 * Usuários/Grupos/Categorias/SLAs/Setores) - não tem rota própria.
 */
export const TICKETS_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'lista' },
  {
    path: 'lista',
    title: 'routes.tickets.list.title',
    loadComponent: () =>
      import('./tickets-list/tickets-list.component').then((m) => m.TicketsListComponent),
  },
  {
    path: ':id',
    title: 'routes.tickets.detail.title',
    loadComponent: () =>
      import('./ticket-detail/ticket-detail.component').then((m) => m.TicketDetailComponent),
  },
  {
    path: '**',
    title: 'routes.notFound.title',
    loadComponent: () => import('../error/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
];
