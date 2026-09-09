import { TicketModel } from '@models/tickets.models';

/** Espelha a resposta de GET /bff/v1/tickets/dashboard (com.nimbusdesk.tickets.dto.response.
 *  TicketDashboardResponse) - ver PROJECT_SPEC.md. 2026-09-09: nomes de campo corrigidos pros
 *  reais do backend (quantidade/tickets) - a versão anterior (count/total/itens) nunca tinha sido
 *  conferida contra a resposta de verdade (mesma classe de bug já achada e corrigida em
 *  NimbusFlowInternalClient.EquipamentoDto), fazia o dashboard inteiro renderizar zerado/vazio em
 *  produção mesmo com chamados reais cadastrados (só "Categorias com chamados" escapava, por
 *  contar o tamanho do array em vez de ler o campo). */
export interface TicketDashboardStatusCountModel {
  status: string;
  quantidade: number;
}

export interface TicketDashboardCategoryCountModel {
  categoriaId: string;
  categoriaNome: string;
  quantidade: number;
}

export interface TicketDashboardSlaOverdueModel {
  quantidade: number;
  tickets: TicketModel[];
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
      quantidade: input?.slaEstourado?.quantidade ?? 0,
      tickets: input?.slaEstourado?.tickets ?? [],
    },
  };
}
