import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { HalPagedResponse } from '@core/api/page.model';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import {
  TicketModel,
  TicketApiModel,
  TicketCreateInput,
  TicketUpsertInput,
  TicketAssignInput,
  TicketStatusChangeInput,
  TicketScopeCountsModel,
  mapTicketApiModel,
  mapTicketApiModels,
} from '@models/tickets.models';
import {
  TicketCommentApiModel,
  TicketCommentModel,
  TicketCommentCreateInput,
  mapTicketCommentApiModels,
} from '@models/ticket-comment.models';
import {
  TicketStatusHistoryApiModel,
  mapTicketStatusHistoryApiModels,
} from '@models/ticket-history.models';
import {
  TicketDashboardApiModel,
  TicketDashboardModel,
  mapTicketDashboardApiModel,
} from '@models/ticket-dashboard.models';
import {
  TicketParticipantApiModel,
  mapTicketParticipantApiModels,
} from '@models/ticket-participant.models';
import { UserOptionApiModel, UserOptionModel, mapUserOptionApiModel } from '@models/groups.models';

@Injectable({ providedIn: 'root' })
export class TicketsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/tickets`;

  searchPaged(body: ListQueryDto<TicketsAdvancedFilters>) {
    return this.http
      .post<HalPagedResponse<TicketApiModel>>(`${this.baseUrl}/search`, body)
      .pipe(
        map((res) => {
          const content = mapTicketApiModels(res?._embedded?.content);
          return {
            ...res,
            _embedded: { ...(res?._embedded ?? {}), content },
          } as HalPagedResponse<TicketModel>;
        }),
      );
  }

  getById(id: string) {
    return this.http.get<TicketApiModel>(`${this.baseUrl}/${id}`).pipe(map(mapTicketApiModel));
  }

  /** multipart/form-data com 2 parts: "data" (JSON de TicketUpsertInput) e "attachments" (0..n
   *  arquivos, opcional) - ver PROJECT_SPEC.md (POST /tickets). */
  create(input: TicketCreateInput) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob(
        [
          JSON.stringify({
            titulo: input.titulo,
            descricao: input.descricao,
            categoriaId: input.categoriaId,
            setorId: input.setorId,
            equipamentoRefId: input.equipamentoRefId,
            participantIds: input.participantIds,
            prioridade: input.prioridade,
          }),
        ],
        { type: 'application/json' },
      ),
    );
    input.attachments.forEach((file) => formData.append('attachments', file));

    return this.http.post<TicketApiModel>(this.baseUrl, formData).pipe(map(mapTicketApiModel));
  }

  /** Só permitido pelo backend enquanto status=ABERTO (ver PROJECT_SPEC.md). */
  update(id: string, input: TicketUpsertInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapTicketApiModel));
  }

  assign(id: string, input: TicketAssignInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/assign`, input)
      .pipe(map(mapTicketApiModel));
  }

  changeStatus(id: string, input: TicketStatusChangeInput) {
    return this.http
      .put<TicketApiModel>(`${this.baseUrl}/${id}/status`, input)
      .pipe(map(mapTicketApiModel));
  }

  /** multipart (não mais JSON puro, desde 2026-09-08): "data" (mensagem+interno) + "attachments"
   *  opcional - anexo só existe vinculado a um comentário agora (ver TicketCommentModel). */
  addComment(id: string, input: TicketCommentCreateInput) {
    const formData = new FormData();
    formData.append(
      'data',
      new Blob([JSON.stringify({ mensagem: input.mensagem, interno: input.interno })], {
        type: 'application/json',
      }),
    );
    input.attachments.forEach((file) => formData.append('attachments', file));

    return this.http
      .post<TicketCommentApiModel>(`${this.baseUrl}/${id}/comments`, formData)
      .pipe(map((res) => ({ ...res }) as TicketCommentModel));
  }

  getComments(id: string) {
    return this.http
      .get<TicketCommentApiModel[]>(`${this.baseUrl}/${id}/comments`)
      .pipe(map(mapTicketCommentApiModels));
  }

  getHistory(id: string) {
    return this.http
      .get<TicketStatusHistoryApiModel[]>(`${this.baseUrl}/${id}/history`)
      .pipe(map(mapTicketStatusHistoryApiModels));
  }

  /** URL pré-assinada com TTL curto - nunca cacheada, sempre buscada na hora do clique (ver
   *  TicketAttachmentModel). */
  getAttachmentUrl(id: string, attachmentId: string) {
    return this.http.get<{ url: string }>(
      `${this.baseUrl}/${id}/attachments/${attachmentId}/url`,
    );
  }

  /** Badges dos escopos "Aguardando minha ação"/"Fila de atendimento" na p-selectButton da lista
   *  (ver TicketsListComponent#scopeOptions). */
  getScopeCounts() {
    return this.http.get<TicketScopeCountsModel>(`${this.baseUrl}/scope-counts`);
  }

  /** "Atribuir responsável" (2026-09-09) - só usuários com CHAMADO_MANAGE (T.I.), diferente de
   *  GET /bff/v1/users/options (todo usuário do NimbusDesk, inclusive SOLICITANTE - usado em
   *  "Compartilhado com", ver UsersFacade). */
  getResponsavelOptions() {
    return this.http
      .get<UserOptionApiModel[]>(`${this.baseUrl}/responsavel-options`)
      .pipe(map((items) => (items ?? []).map(mapUserOptionApiModel) as UserOptionModel[]));
  }

  getDashboard() {
    return this.http
      .get<TicketDashboardApiModel>(`${this.baseUrl}/dashboard`)
      .pipe(map((res): TicketDashboardModel => mapTicketDashboardApiModel(res)));
  }

  /** "Compartilhado com" - normalmente lido a partir de TicketModel.participantes (já embutido no
   *  getById), mas exposto à parte pra quando só a lista de participantes precisa ser recarregada
   *  (ver TicketsFacade.reloadParticipants). */
  getParticipants(id: string) {
    return this.http
      .get<TicketParticipantApiModel[]>(`${this.baseUrl}/${id}/participants`)
      .pipe(map(mapTicketParticipantApiModels));
  }

  /** Replace-all (ver TicketParticipantsRequest no backend) - envia a lista completa de userIds
   *  desejada, não um diff. */
  updateParticipants(id: string, userIds: string[]) {
    return this.http
      .put<TicketParticipantApiModel[]>(`${this.baseUrl}/${id}/participants`, { userIds })
      .pipe(map(mapTicketParticipantApiModels));
  }
}
