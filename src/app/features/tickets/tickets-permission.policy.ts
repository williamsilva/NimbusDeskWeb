import { Injectable, inject } from '@angular/core';

import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { TicketModel } from '@models/tickets.models';

/**
 * Abrir chamado é livre (qualquer usuário autenticado pode reportar) e ver os próprios chamados
 * também - ver `canManage`. `canViewAll` controla o toggle "Todos" na listagem e o gate de rota de
 * `/tickets` (mesmo sem CHAMADO_CONSULT, o usuário ainda acessa a rota, só que travado em "Meus
 * chamados" - ver TicketsListComponent). Editar (só enquanto ABERTO)/mudar status/atribuir
 * responsável/comentário interno exigem CHAMADO_MANAGE.
 */
@Injectable({ providedIn: 'root' })
export class TicketsPermissionPolicy {
  private readonly perms = inject(PermissionService);

  canViewAll(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.VIEW);
  }

  canCreate(): boolean {
    return true;
  }

  canManage(): boolean {
    return this.perms.hasSupportOr(PERMISSIONS.CHAMADO.MANAGE);
  }

  /** Só o próprio solicitante (ou quem já tem CHAMADO_MANAGE) edita - e só enquanto ABERTO,
   *  validação real sempre server-side (ver PROJECT_SPEC.md). */
  canEdit(ticket: Pick<TicketModel, 'status' | 'solicitanteId'>): boolean {
    if (ticket.status !== 'ABERTO') return false;
    return this.canManage() || this.perms.isCurrentUserId(ticket.solicitanteId);
  }

  /** Participantes ("compartilhado com") - mesma regra de dono do canEdit, mas SEM restrição de
   *  status (o solicitante pode adicionar/remover gente acompanhando o chamado a qualquer momento
   *  do ciclo de vida, não só enquanto ABERTO - ver TicketService#replaceParticipants). */
  canManageParticipants(ticket: Pick<TicketModel, 'solicitanteId'>): boolean {
    return this.canManage() || this.perms.isCurrentUserId(ticket.solicitanteId);
  }
}
