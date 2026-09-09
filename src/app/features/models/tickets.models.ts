import { TicketStatusEnum } from '@models/enums/ticket-status.enum';
import { TicketPriorityEnum } from '@models/enums/ticket-priority.enum';
import { TicketParticipantModel } from '@models/ticket-participant.models';
import { TicketsScope } from '@features/filter/tickets.filters';

/** Espelha com.nimbusdesk.tickets.model.CanalOrigem do NimbusDeskServer - só PORTAL implementado
 *  nesta fase (EMAIL/TELEFONE são placeholder pra futuro, ver PROJECT_SPEC.md). */
export type TicketCanalOrigem = 'PORTAL' | 'EMAIL' | 'TELEFONE';

/**
 * Espelha com.nimbusdesk.tickets.dto.response.TicketResponse do NimbusDeskServer. Campos com
 * sufixo "Nome" já vêm resolvidos pelo backend (UserDirectoryService/joins com
 * Category/Setor/EquipamentoRef) - o frontend só consome, nunca resolve de novo (ver
 * PROJECT_SPEC.md / instruções do módulo).
 */
export interface TicketModel {
  id: string;
  numero: string;
  titulo: string;
  /** 2026-09-08: também existe como o PRIMEIRO comentário da conversa (ver
   *  TicketCommentModel/ticket-detail.component.html) - este campo continua sendo o valor "vivo"
   *  (usado no formulário de edição/listagem), mas o ticket-detail não renderiza mais ele à parte. */
  descricao: string;
  status: TicketStatusEnum;
  prioridade: TicketPriorityEnum;
  categoriaId: string;
  categoriaNome: string | null;
  slaId: string | null;
  slaNome: string | null;
  setorId: string | null;
  setorNome: string | null;
  solicitanteId: string;
  solicitanteNome: string | null;
  responsavelId: string | null;
  responsavelNome: string | null;
  equipamentoRefId: string | null;
  equipamentoRefCodigo: string | null;
  equipamentoRefNome: string | null;
  canalOrigem: TicketCanalOrigem;
  dataAbertura: string | null;
  dataLimiteSla: string | null;
  /** Calculado em leitura pelo backend (dataLimiteSla no passado e status ainda ativo) - preferir
   *  este campo em vez de recalcular no cliente quando disponível (ver isTicketSlaOverdue,
   *  mantida como fallback pra telas que só têm status+dataLimiteSla à mão, ex. lista). */
  slaEstourado: boolean;
  dataResolucao: string | null;
  dataFechamento: string | null;
  /** Calculado em leitura pelo backend ({@code aguardandoAcaoDe == usuário atual}) - alimenta o
   *  escopo "Aguardando minha ação" da lista (ver TicketsScope) e pode virar badge no detalhe. */
  aguardandoMinhaAcao: boolean;
  /** Embutido - "compartilhado com" (ver TicketParticipantModel), gerenciado via
   *  TicketsApiService.updateParticipants (replace-all). */
  participantes: TicketParticipantModel[];
  createdAt: string | null;
  updatedAt: string | null;
}

export type TicketApiModel = TicketModel;

export interface TicketUpsertInput {
  titulo: string;
  descricao: string;
  categoriaId: string;
  setorId: string | null;
  equipamentoRefId: string | null;
}

export interface TicketCreateInput extends TicketUpsertInput {
  attachments: File[];
  /** "Compartilhado com" já na abertura (2026-09-08) - o próprio solicitante nunca precisa vir
   *  aqui (é filtrado tanto na tela, ver TicketsCreateDialogComponent#participantOptions, quanto
   *  de novo no backend por segurança, ver TicketService#saveParticipants). */
  participantIds: string[];
  /** 2026-09-09: só existe na CRIAÇÃO (não faz parte de TicketUpsertInput, compartilhado com a
   *  edição) - antes vinha só do extinto {@code prioridadeDefault} da categoria/SLA escolhida, sem
   *  o usuário poder opinar; agora o solicitante sempre informa direto na abertura (ver
   *  TicketsCreateDialogComponent), obrigatório também no backend (com.nimbusdesk.tickets.dto.
   *  request.TicketRequest#prioridade). */
  prioridade: TicketPriorityEnum;
}

export interface TicketAssignInput {
  responsavelId: string;
}

export interface TicketStatusChangeInput {
  novoStatus: TicketStatusEnum;
}

/** Espelha com.nimbusdesk.tickets.dto.response.TicketScopeCountsResponse do NimbusDeskServer -
 *  badges dos 5 escopos na p-selectButton da lista (ver TicketsListComponent) - todos já excluem
 *  chamados RESOLVIDO/FECHADO/CANCELADO ("encerrados"), só contam trabalho ainda em aberto.
 *  {@code all} TEM contagem própria (2026-09-08, não é mais soma de mine+waiting+shared+queue: um
 *  chamado pode satisfazer mais de um escopo ao mesmo tempo - ex. sou solicitante E estou
 *  aguardando ação nele - então somar contava ele em dobro). */
export interface TicketScopeCountsModel {
  mine: number;
  waiting: number;
  shared: number;
  queue: number;
  all: number;
}

export interface TicketsFiltersState {
  scope: TicketsScope;
  status: string[] | null;
  prioridade: string[] | null;
  categoriaId: string | null;
  setorId: string | null;
}

export function mapTicketApiModel(input: TicketApiModel): TicketModel {
  return { ...input };
}

export function mapTicketApiModels(items: TicketApiModel[] | null | undefined): TicketModel[] {
  return (items ?? []).map(mapTicketApiModel);
}

/** SLA estourado - calculado em leitura no backend (dataLimiteSla no passado e status ainda
 *  "aberto"), mas o frontend também precisa da mesma regra pra destacar a linha na listagem/
 *  detalhe sem esperar um recarregamento do dashboard. */
export function isTicketSlaOverdue(ticket: Pick<TicketModel, 'status' | 'dataLimiteSla'>): boolean {
  if (!ticket.dataLimiteSla) return false;
  if (
    ticket.status === TicketStatusEnum.RESOLVIDO ||
    ticket.status === TicketStatusEnum.FECHADO ||
    ticket.status === TicketStatusEnum.CANCELADO
  ) {
    return false;
  }
  return new Date(ticket.dataLimiteSla).getTime() < Date.now();
}
