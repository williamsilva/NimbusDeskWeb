import { I18nService } from '@core/i18n/i18n.service';
import { StatusTone } from '@shared/features/status-badge/status-badge.component';

/**
 * Espelha com.nimbusdesk.tickets.model.TicketPriority do NimbusDeskServer. Reconciliado em
 * 2026-09-07: o backend (implementado em paralelo) decidiu por 4 níveis, incluindo URGENTE
 * (indisponibilidade total, ex. servidor fora do ar - sem equivalente no domínio de "relato de
 * ocorrência" do NimbusFlow, de onde o padrão arquitetural foi copiado).
 */
export enum TicketPriorityEnum {
  URGENTE = 'URGENTE',
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAIXA = 'BAIXA',
}

export const TICKET_PRIORITY_VALUES: TicketPriorityEnum[] = [
  TicketPriorityEnum.URGENTE,
  TicketPriorityEnum.ALTA,
  TicketPriorityEnum.MEDIA,
  TicketPriorityEnum.BAIXA,
];

const TONE_MAP: Record<TicketPriorityEnum, StatusTone> = {
  [TicketPriorityEnum.URGENTE]: 'danger',
  [TicketPriorityEnum.ALTA]: 'warn',
  [TicketPriorityEnum.MEDIA]: 'warn',
  [TicketPriorityEnum.BAIXA]: 'info',
};

export function ticketPriorityTone(
  priority: TicketPriorityEnum | string | null | undefined,
): StatusTone {
  return priority ? (TONE_MAP[priority as TicketPriorityEnum] ?? 'neutral') : 'neutral';
}

export function ticketPriorityLabel(
  priority: TicketPriorityEnum | string | null | undefined,
  i18n: I18nService,
): string {
  if (!priority) return '-';
  return i18n.tUi(`tickets.priority.${priority}` as never);
}
