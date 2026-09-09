/** Espelha o body de POST /bff/v1/tickets/search (ver PROJECT_SPEC.md): `{ advanced: { scope,
 *  status?, prioridade?, categoriaId?, setorId? }, page, size, sort }`. `scope` não é um filtro do
 *  painel "filtros avançados" - é o toggle no topo da listagem (ver TicketsListComponent), mas
 *  viaja no mesmo objeto `advanced` do resto dos filtros.
 *
 *  - `mine` (default): solicitante=eu OU responsável=eu.
 *  - `waiting`: "de quem é a vez de agir" sou eu (comentário público ou mudança de status trocou o
 *    lado que precisa responder - ver TicketModel.aguardandoMinhaAcao).
 *  - `shared`: sou participante ("compartilhado comigo" - ver TicketParticipantModel), sem ser
 *    solicitante nem responsável.
 *  - `queue`: "fila de atendimento" - ABERTO sem responsável ainda, mais antigo primeiro (FIFO) -
 *    só disponível pra quem tem CHAMADO_MANAGE (ver TicketsPermissionPolicy.canManage). É daqui
 *    que o técnico de TI assume um chamado (ver TicketsListComponent.assignToMe).
 *  - `all`: todos os chamados - só disponível pra quem tem CHAMADO_CONSULT (ver
 *    TicketsPermissionPolicy.canViewAll).
 */
export type TicketsScope = 'mine' | 'waiting' | 'shared' | 'queue' | 'all';

export interface TicketsAdvancedFilters {
  scope: TicketsScope;

  status?: string[] | null;
  prioridade?: string[] | null;
  categoriaId?: string | null;
  setorId?: string | null;
}
