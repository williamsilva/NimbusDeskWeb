import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { TicketsApiService } from '@features/service/tickets.api.service';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import { ListQueryDto } from '@williamsilva/nimbus-web-commons';
import {
  TicketModel,
  TicketCreateInput,
  TicketUpsertInput,
  TicketAssignInput,
  TicketStatusChangeInput,
  TicketScopeCountsModel,
} from '@models/tickets.models';
import { TicketCommentModel, TicketCommentCreateInput } from '@models/ticket-comment.models';
import { TicketStatusHistoryModel } from '@models/ticket-history.models';
import { TicketParticipantModel } from '@models/ticket-participant.models';
import { SelectOption } from '@models/select-option.model';

type LastQuery = ListQueryDto<TicketsAdvancedFilters>;

/**
 * Único facade pro módulo de Chamados - lista (search paginado) + detalhe (ticket atual +
 * comentários + histórico + anexos), mesmo espírito monolítico de GroupsFacade (entidade rica com
 * vários sub-recursos, em vez de um facade por sub-recurso). `ticket-detail` (tela dedicada) usa só
 * a metade "detalhe"; `tickets-list` usa só a metade "lista".
 */
@Injectable({ providedIn: 'root' })
export class TicketsFacade {
  private readonly api = inject(TicketsApiService);

  // ---- lista ----
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<TicketModel[]>([]);
  private readonly _lastQuery = signal<LastQuery | null>(null);
  private readonly _scopeCounts = signal<TicketScopeCountsModel>({ mine: 0, waiting: 0, shared: 0, queue: 0, all: 0 });

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly totalRecords = this._total.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  /** Badges dos escopos "Aguardando minha ação"/"Fila de atendimento" (ver
   *  TicketsListComponent#scopeOptions) - recarregado a cada #loadPage, pra ficar sempre coerente
   *  com o que a lista está mostrando (ex. assumir um chamado da fila muda os dois números). */
  readonly scopeCounts = this._scopeCounts.asReadonly();

  // ---- detalhe ----
  private readonly _ticket = signal<TicketModel | null>(null);
  private readonly _ticketLoading = signal(false);
  private readonly _comments = signal<TicketCommentModel[]>([]);
  private readonly _commentsLoading = signal(false);
  private readonly _history = signal<TicketStatusHistoryModel[]>([]);
  private readonly _historyLoading = signal(false);
  private readonly _participants = signal<TicketParticipantModel[]>([]);
  private readonly _participantsSaving = signal(false);
  private readonly _responsavelOptions = signal<SelectOption<string>[]>([]);
  private readonly _responsavelOptionsLoadedOnce = signal(false);

  readonly ticket = this._ticket.asReadonly();
  readonly ticketLoading = this._ticketLoading.asReadonly();
  readonly comments = this._comments.asReadonly();
  readonly commentsLoading = this._commentsLoading.asReadonly();
  readonly history = this._history.asReadonly();
  readonly historyLoading = this._historyLoading.asReadonly();
  readonly participants = this._participants.asReadonly();
  readonly participantsSaving = this._participantsSaving.asReadonly();
  /** "Atribuir responsável" (2026-09-09) - só usuários com CHAMADO_MANAGE (T.I.), diferente da
   *  UsersFacade#options genérica (todo usuário do NimbusDesk, usada em "Compartilhado com"). */
  readonly responsavelOptions = this._responsavelOptions.asReadonly();

  loadPage(q: LastQuery): void {
    if (this._loading()) return;

    this._loading.set(true);
    this._lastQuery.set(q);
    this.loadScopeCounts();

    this.api
      .searchPaged(q)
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._loadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (res) => {
          this._items.set(res?._embedded?.content ?? []);
          this._total.set(res?.page?.totalElements ?? 0);
        },
        error: () => {
          this._items.set([]);
          this._total.set(0);
        },
      });
  }

  private loadScopeCounts(): void {
    this.api.getScopeCounts().subscribe({
      next: (counts) => this._scopeCounts.set(counts),
      error: () => this._scopeCounts.set({ mine: 0, waiting: 0, shared: 0, queue: 0, all: 0 }),
    });
  }

  reloadLast(): void {
    const last = this._lastQuery();
    if (!last) return;

    this.loadPage(last);
  }

  create(input: TicketCreateInput): Observable<TicketModel> {
    return this.api.create(input).pipe(tap(() => this.reloadLast()));
  }

  update(id: string, input: TicketUpsertInput): Observable<TicketModel> {
    return this.api.update(id, input).pipe(
      tap((updated) => {
        this._ticket.set(updated);
        this.reloadLast();
      }),
    );
  }

  loadTicket(id: string): void {
    this._ticketLoading.set(true);

    this.api
      .getById(id)
      .pipe(finalize(() => this._ticketLoading.set(false)))
      .subscribe({
        next: (ticket) => {
          this._ticket.set(ticket);
          // Participantes vêm embutidos no próprio TicketResponse (tem GET próprio, mas
          // raramente precisa dele já que o getById já traz tudo) - semeia a partir daqui. Anexos
          // (2026-09-08: sempre vinculados a um comentário, o de abertura incluso - ver
          // comment.attachments/loadComments) já vêm prontos no respectivo modelo, sem estado
          // próprio no facade.
          this._participants.set(ticket.participantes ?? []);
        },
        error: () => this._ticket.set(null),
      });
  }

  assign(id: string, input: TicketAssignInput): Observable<TicketModel> {
    return this.api.assign(id, input).pipe(
      tap((updated) => {
        this._ticket.set(updated);
        this.loadHistory(id);
      }),
    );
  }

  changeStatus(id: string, input: TicketStatusChangeInput): Observable<TicketModel> {
    return this.api.changeStatus(id, input).pipe(
      tap((updated) => {
        this._ticket.set(updated);
        this.loadHistory(id);
      }),
    );
  }

  loadComments(id: string): void {
    this._commentsLoading.set(true);

    this.api
      .getComments(id)
      .pipe(finalize(() => this._commentsLoading.set(false)))
      .subscribe({
        next: (comments) => this._comments.set(comments),
        error: () => this._comments.set([]),
      });
  }

  addComment(id: string, input: TicketCommentCreateInput): Observable<TicketCommentModel> {
    return this.api.addComment(id, input).pipe(tap(() => this.loadComments(id)));
  }

  loadHistory(id: string): void {
    this._historyLoading.set(true);

    this.api
      .getHistory(id)
      .pipe(finalize(() => this._historyLoading.set(false)))
      .subscribe({
        next: (history) => this._history.set(history),
        error: () => this._history.set([]),
      });
  }

  getAttachmentUrl(id: string, attachmentId: string): Observable<{ url: string }> {
    return this.api.getAttachmentUrl(id, attachmentId);
  }

  /** {@code force} força recarregar mesmo já tendo carregado antes - mesmo racional de
   *  UsersFacade#loadUsersOptions (facade cacheada sem TTL). */
  loadResponsavelOptions(force = false): void {
    if (!force && this._responsavelOptionsLoadedOnce()) return;

    this.api.getResponsavelOptions().subscribe({
      next: (list) => {
        this._responsavelOptionsLoadedOnce.set(true);
        this._responsavelOptions.set((list ?? []).map((u) => ({ label: u.name, value: u.id })));
      },
      error: () => this._responsavelOptions.set([]),
    });
  }

  /** Replace-all - envia a lista COMPLETA de userIds desejada (não um diff). */
  updateParticipants(id: string, userIds: string[]): Observable<TicketParticipantModel[]> {
    this._participantsSaving.set(true);
    return this.api.updateParticipants(id, userIds).pipe(
      finalize(() => this._participantsSaving.set(false)),
      tap((participants) => this._participants.set(participants)),
    );
  }

  /** Limpa o estado de detalhe ao sair da tela (evita mostrar dados do chamado anterior por um
   *  instante ao navegar direto de um /tickets/:id pra outro). */
  clearTicket(): void {
    this._ticket.set(null);
    this._comments.set([]);
    this._history.set([]);
    this._participants.set([]);
  }
}
