/**
 * Espelha com.nimbusdesk.tickets.dto.response.TicketAttachmentResponse do NimbusDeskServer. Sem
 * `url` de propósito - a URL pré-assinada (MinIO/S3, TTL curto) só é obtida sob demanda via
 * `GET /tickets/{id}/attachments/{attachmentId}/url` (ver TicketsApiService.getAttachmentUrl),
 * nunca cacheada/persistida no modelo (mesma cautela de TicketClosePhotoModel no NimbusFlowWeb).
 */
export interface TicketAttachmentModel {
  id: string;
  ticketId: string;
  nomeArquivo: string;
  tipoMime: string | null;
  tamanhoBytes: number | null;
  createdAt: string;
}

export type TicketAttachmentApiModel = TicketAttachmentModel;

export function mapTicketAttachmentApiModel(
  input: TicketAttachmentApiModel,
): TicketAttachmentModel {
  return { ...input };
}

export function mapTicketAttachmentApiModels(
  items: TicketAttachmentApiModel[] | null | undefined,
): TicketAttachmentModel[] {
  return (items ?? []).map(mapTicketAttachmentApiModel);
}
