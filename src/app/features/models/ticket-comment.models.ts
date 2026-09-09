import { TicketAttachmentModel } from '@models/ticket-attachment.models';

/**
 * Espelha com.nimbusdesk.tickets.dto.response.TicketCommentResponse do NimbusDeskServer. `autorNome`
 * já vem resolvido pelo backend via UserDirectoryService.summaryFor() (ver PROJECT_SPEC.md) - nunca
 * resolvido de novo aqui. `interno=true` só é retornado pelo backend pra quem tem CHAMADO_MANAGE -
 * o frontend não precisa filtrar de novo, mas usa o flag pra estilizar a bolha do comentário.
 *
 * `attachments` (2026-09-08): anexo só existe vinculado a um comentário agora (melhora a
 * visualização - some da lista solta de "Anexos" e aparece junto da mensagem que o trouxe).
 */
export interface TicketCommentModel {
  id: string;
  ticketId: string;
  autorId: string;
  autorNome: string | null;
  mensagem: string;
  interno: boolean;
  attachments: TicketAttachmentModel[];
  createdAt: string;
}

export type TicketCommentApiModel = TicketCommentModel;

export interface TicketCommentCreateInput {
  mensagem: string;
  interno: boolean;
  attachments: File[];
}

export function mapTicketCommentApiModel(input: TicketCommentApiModel): TicketCommentModel {
  return { ...input };
}

export function mapTicketCommentApiModels(
  items: TicketCommentApiModel[] | null | undefined,
): TicketCommentModel[] {
  return (items ?? []).map(mapTicketCommentApiModel);
}
