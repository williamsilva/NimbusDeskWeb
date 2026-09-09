import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/** Espelha com.nimbusdesk.tickets.model.TicketStatus do NimbusDeskServer (ver PROJECT_SPEC.md). */
export enum TicketStatusEnum {
  ABERTO = 'ABERTO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  AGUARDANDO_SOLICITANTE = 'AGUARDANDO_SOLICITANTE',
  /** Solicitante respondeu por último - agora é a vez do T.I. (2026-09-08: muda automaticamente a
   *  cada comentário público trocado, ver TicketCommentService#applyWaitingAction no backend). */
  AGUARDANDO_RESPOSTA = 'AGUARDANDO_RESPOSTA',
  RESOLVIDO = 'RESOLVIDO',
  FECHADO = 'FECHADO',
  CANCELADO = 'CANCELADO',
}

export const TICKET_STATUS_VALUES: TicketStatusEnum[] = [
  TicketStatusEnum.ABERTO,
  TicketStatusEnum.EM_ANDAMENTO,
  TicketStatusEnum.AGUARDANDO_SOLICITANTE,
  TicketStatusEnum.AGUARDANDO_RESPOSTA,
  TicketStatusEnum.RESOLVIDO,
  TicketStatusEnum.FECHADO,
  TicketStatusEnum.CANCELADO,
];

/** Status em que o chamado ainda está "vivo" - usado pra calcular SLA estourado
 *  (dataLimiteSla < now() && status not in RESOLVIDO/FECHADO/CANCELADO, ver PROJECT_SPEC.md). */
export const TICKET_OPEN_STATUSES: TicketStatusEnum[] = [
  TicketStatusEnum.ABERTO,
  TicketStatusEnum.EM_ANDAMENTO,
  TicketStatusEnum.AGUARDANDO_SOLICITANTE,
  TicketStatusEnum.AGUARDANDO_RESPOSTA,
];

/** Espelha com.nimbusdesk.tickets.core.TicketStatusTransitions#TERMINAL_STATUSES - chamado
 *  "encerrado", não aceita mais NENHUMA interação (comentário/anexo), independente de permissão
 *  (2026-09-08, decisão do usuário). Usado pra esconder o composer de comentário no ticket-detail -
 *  a validação real de verdade é sempre server-side (ver TicketCommentService#add). */
export const TICKET_TERMINAL_STATUSES: TicketStatusEnum[] = [
  TicketStatusEnum.RESOLVIDO,
  TicketStatusEnum.FECHADO,
  TicketStatusEnum.CANCELADO,
];

export function isTicketStatusTerminal(status: TicketStatusEnum | string | null | undefined): boolean {
  return !!status && TICKET_TERMINAL_STATUSES.includes(status as TicketStatusEnum);
}

const TONE_MAP: Record<TicketStatusEnum, StatusTone> = {
  [TicketStatusEnum.ABERTO]: 'info',
  [TicketStatusEnum.EM_ANDAMENTO]: 'warn',
  [TicketStatusEnum.AGUARDANDO_SOLICITANTE]: 'neutral',
  [TicketStatusEnum.AGUARDANDO_RESPOSTA]: 'warn',
  [TicketStatusEnum.RESOLVIDO]: 'success',
  [TicketStatusEnum.FECHADO]: 'success',
  [TicketStatusEnum.CANCELADO]: 'danger',
};

export function ticketStatusTone(status: TicketStatusEnum | string | null | undefined): StatusTone {
  return status ? (TONE_MAP[status as TicketStatusEnum] ?? 'neutral') : 'neutral';
}

export function ticketStatusLabel(
  status: TicketStatusEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!status) return '-';
  return i18n.tUi(`tickets.status.${status}` as never);
}

/**
 * Transições permitidas por status atual - mesma matriz descrita no PROJECT_SPEC.md (validação
 * simples, sem state machine formal, espelhando o que o TicketService do backend também valida).
 * Usado só pra popular o dropdown de "mudar status" no ticket-detail - a validação real de
 * verdade é sempre server-side.
 */
const ALLOWED_TRANSITIONS: Record<TicketStatusEnum, TicketStatusEnum[]> = {
  [TicketStatusEnum.ABERTO]: [TicketStatusEnum.EM_ANDAMENTO, TicketStatusEnum.CANCELADO],
  [TicketStatusEnum.EM_ANDAMENTO]: [
    TicketStatusEnum.AGUARDANDO_SOLICITANTE,
    TicketStatusEnum.AGUARDANDO_RESPOSTA,
    TicketStatusEnum.RESOLVIDO,
    TicketStatusEnum.CANCELADO,
  ],
  [TicketStatusEnum.AGUARDANDO_SOLICITANTE]: [
    TicketStatusEnum.EM_ANDAMENTO,
    TicketStatusEnum.AGUARDANDO_RESPOSTA,
    TicketStatusEnum.RESOLVIDO,
  ],
  [TicketStatusEnum.AGUARDANDO_RESPOSTA]: [
    TicketStatusEnum.EM_ANDAMENTO,
    TicketStatusEnum.AGUARDANDO_SOLICITANTE,
    TicketStatusEnum.RESOLVIDO,
  ],
  [TicketStatusEnum.RESOLVIDO]: [TicketStatusEnum.FECHADO, TicketStatusEnum.EM_ANDAMENTO],
  // 2026-09-08: FECHADO virou terminal de verdade - decisão do usuário (fechado/cancelado não
  // mudam mais de status nenhum, diferente de RESOLVIDO, que ainda pode voltar pra EM_ANDAMENTO).
  [TicketStatusEnum.FECHADO]: [],
  [TicketStatusEnum.CANCELADO]: [],
};

export function ticketAllowedNextStatuses(
  status: TicketStatusEnum | string | null | undefined,
): TicketStatusEnum[] {
  if (!status) return [];
  return ALLOWED_TRANSITIONS[status as TicketStatusEnum] ?? [];
}
