import { TicketModel } from '@models/tickets.models';

/** Espelha a resposta de GET /bff/v1/tickets/dashboard (com.nimbusdesk.tickets.dto.response.
 *  TicketDashboardResponse) - ver PROJECT_SPEC.md. */
export interface TicketDashboardStatusCountModel {
  status: string;
  count: number;
}

export interface TicketDashboardCategoryCountModel {
  categoriaNome: string;
  count: number;
}

export interface TicketDashboardSlaOverdueModel {
  total: number;
  itens: TicketModel[];
}

export interface TicketDashboardModel {
  porStatus: TicketDashboardStatusCountModel[];
  slaEstourado: TicketDashboardSlaOverdueModel;
  porCategoria: TicketDashboardCategoryCountModel[];
}

export type TicketDashboardApiModel = TicketDashboardModel;

export function mapTicketDashboardApiModel(input: TicketDashboardApiModel): TicketDashboardModel {
  return {
    porStatus: input?.porStatus ?? [],
    porCategoria: input?.porCategoria ?? [],
    slaEstourado: {
      total: input?.slaEstourado?.total ?? 0,
      itens: input?.slaEstourado?.itens ?? [],
    },
  };
}
