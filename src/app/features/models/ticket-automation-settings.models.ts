/** Espelha com.nimbusdesk.tickets.dto.response.TicketAutomationSettingsResponse do
 *  NimbusDeskServer - Configurações > Automação de chamados (2026-09-09): periodicidade dos 3 jobs
 *  pedidos pelo usuário (alerta de chamado sem responsável, alerta de pendência de resposta,
 *  auto-fechamento Resolvido -> Fechado). Linha única, sem paginação (mesmo padrão de
 *  EmailSettingsModel/SlaModel). */
export interface TicketAutomationSettingsModel {
  unassignedAlertPeriodicidadeDias: number;
  pendingResponseAlertPeriodicidadeDias: number;
  autoClosePeriodicidadeDias: number;
  autoCloseCarenciaDias: number;
  updatedAt: string | null;
}

export type TicketAutomationSettingsApiModel = TicketAutomationSettingsModel;

export interface TicketAutomationSettingsUpsertInput {
  unassignedAlertPeriodicidadeDias: number;
  pendingResponseAlertPeriodicidadeDias: number;
  autoClosePeriodicidadeDias: number;
  autoCloseCarenciaDias: number;
}

export function mapTicketAutomationSettingsApiModel(
  input: TicketAutomationSettingsApiModel,
): TicketAutomationSettingsModel {
  return { ...input };
}
