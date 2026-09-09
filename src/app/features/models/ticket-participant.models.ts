/**
 * Espelha com.nimbusdesk.tickets.dto.response.TicketParticipantResponse do NimbusDeskServer -
 * "compartilhado com" (usuário adicionado pelo solicitante ou por CHAMADO_MANAGE pra acompanhar o
 * chamado sem ser o dono nem o responsável). Sem `id` próprio nem `createdAt` de propósito - a
 * lista inteira é gerenciada via replace-all (ver TicketsApiService.updateParticipants), o
 * frontend só precisa do userId pra montar o payload de volta.
 */
export interface TicketParticipantModel {
  userId: string;
  nome: string | null;
}

export type TicketParticipantApiModel = TicketParticipantModel;

export function mapTicketParticipantApiModels(
  items: TicketParticipantApiModel[] | null | undefined,
): TicketParticipantModel[] {
  return items ?? [];
}
