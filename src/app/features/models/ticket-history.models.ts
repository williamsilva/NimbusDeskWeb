/** Espelha com.nimbusdesk.tickets.dto.response.TicketStatusHistoryResponse do NimbusDeskServer -
 *  uma linha por transição de status (ver PROJECT_SPEC.md), auditoria explícita que não existe no
 *  NimbusFlow (lá o rastro é implícito). `usuarioNome` resolvido pelo backend. */
export interface TicketStatusHistoryModel {
  id: string;
  ticketId: string;
  statusAnterior: string | null;
  statusNovo: string;
  usuarioId: string;
  usuarioNome: string | null;
  timestamp: string;
}

export type TicketStatusHistoryApiModel = TicketStatusHistoryModel;

export function mapTicketStatusHistoryApiModel(
  input: TicketStatusHistoryApiModel,
): TicketStatusHistoryModel {
  return { ...input };
}

export function mapTicketStatusHistoryApiModels(
  items: TicketStatusHistoryApiModel[] | null | undefined,
): TicketStatusHistoryModel[] {
  return (items ?? []).map(mapTicketStatusHistoryApiModel);
}
