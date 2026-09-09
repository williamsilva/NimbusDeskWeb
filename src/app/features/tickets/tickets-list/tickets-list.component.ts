import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Component, DestroyRef, ViewChild, computed, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { debounceTime } from 'rxjs/operators';

import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabel } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { STATE_KEY } from '@features/state-key.constants';
import { PermissionService } from '@core/auth/permission.service';

import { TicketsFacade } from '@features/facade/tickets.facade';
import { SetorFacade } from '@features/facade/setor.facade';
import { CategoryFacade } from '@features/facade/category.facade';
import { TicketEventsService } from '@features/service/ticket-events.service';
import { StatefulListPage, buildListQuery } from '@williamsilva/nimbus-web-commons';
import { CsBadgeComponent } from '@shared/ui/badge/cs-badge.component';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TicketsAdvancedFilters } from '@features/filter/tickets.filters';
import { TicketsPermissionPolicy } from '@features/tickets/tickets-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import { TicketsCreateDialogComponent } from '@features/tickets/tickets-create/tickets-create-dialog.component';
import {
  TICKET_STATUS_VALUES,
  TICKET_OPEN_STATUSES,
  ticketStatusTone,
} from '@models/enums/ticket-status.enum';
import { TICKET_PRIORITY_VALUES, ticketPriorityTone } from '@models/enums/ticket-priority.enum';
import { TicketModel, TicketsFiltersState, isTicketSlaOverdue } from '@models/tickets.models';
import { TicketsScope } from '@features/filter/tickets.filters';
import {
  ActiveFilterItem,
  FiltersPanelComponent,
  readSingleFilterValue,
  readArrayFilterValues,
} from '@williamsilva/nimbus-web-commons';

@Component({
  standalone: true,
  selector: 'app-tickets-list',
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.scss',
  imports: [
    CsDatePipe,
    TimeAgoPipe,
    FloatLabel,
    FormsModule,
    SelectModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    MultiSelectModule,
    SelectButtonModule,
    CsBadgeComponent,
    PageHeaderComponent,
    FiltersPanelComponent,
    StatusBadgeComponent,
    TicketsCreateDialogComponent,
  ],
})
export class TicketsListComponent
  extends StatefulListPage<TicketsFiltersState, TicketsAdvancedFilters>
  implements OnInit
{
  @ViewChild('dt') private dt?: Table;

  protected override readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly perms = inject(PermissionService);
  private readonly ticketEvents = inject(TicketEventsService);

  readonly facade = inject(TicketsFacade);
  readonly categoryFacade = inject(CategoryFacade);
  readonly setorFacade = inject(SetorFacade);
  readonly policy = inject(TicketsPermissionPolicy);

  override rows =
    Number(localStorage.getItem(this.tableRowsKey())) || StatefulListPage.DEFAULT_ROWS;

  /** "Todos" só aparece pra quem tem CHAMADO_CONSULT (ver TicketsPermissionPolicy.canViewAll);
   *  "Fila de atendimento" só pra quem tem CHAMADO_MANAGE (canManage - só quem pode assumir um
   *  chamado precisa ver quem está esperando). Os outros 3 escopos (mine/waiting/shared) são
   *  sempre "meus", nunca precisam de permissão. */
  readonly canToggleScope = computed(() => this.policy.canViewAll());
  readonly canSeeQueue = computed(() => this.policy.canManage());
  scope = signal<TicketsScope>('mine');

  createVisible = signal(false);
  readonly assigningToMeId = signal<string | null>(null);

  /** Valor inicial antes de qualquer cache ser restaurado - ver applyDefaultAdvancedFilters. */
  status = signal<string[] | null>(this.defaultStatus());
  prioridade = signal<string[] | null>(null);
  categoriaId = signal<string | null>(null);
  setorId = signal<string | null>(null);

  /** {@code count} vem de TicketsFacade#scopeCounts, já excluindo chamados "encerrados"
   *  (RESOLVIDO/FECHADO/CANCELADO) - {@code all} tem contagem PRÓPRIA no backend (2026-09-08, não
   *  soma mine+waiting+shared+queue aqui: um chamado pode satisfazer mais de um escopo ao mesmo
   *  tempo - ex. sou solicitante E estou aguardando ação nele - somar contava ele em dobro). */
  readonly scopeOptions = computed(() => {
    const counts = this.facade.scopeCounts();
    const opts: { label: string; value: TicketsScope; count?: number }[] = [
      { label: this.i18n.tUi('tickets.scope.mine' as never), value: 'mine', count: counts.mine },
      { label: this.i18n.tUi('tickets.scope.waiting' as never), value: 'waiting', count: counts.waiting },
      { label: this.i18n.tUi('tickets.scope.shared' as never), value: 'shared', count: counts.shared },
    ];
    if (this.canSeeQueue()) {
      opts.push({ label: this.i18n.tUi('tickets.scope.queue' as never), value: 'queue', count: counts.queue });
    }
    if (this.canToggleScope()) {
      opts.push({ label: this.i18n.tUi('tickets.scope.all' as never), value: 'all', count: counts.all });
    }
    return opts;
  });

  readonly statusOptions = computed(() => {
    this.i18n.getAppliedLang();
    return TICKET_STATUS_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`tickets.status.${value}` as never),
    }));
  });

  readonly priorityOptions = computed(() => {
    this.i18n.getAppliedLang();
    return TICKET_PRIORITY_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`tickets.priority.${value}` as never),
    }));
  });

  readonly categoryOptions = this.categoryFacade.options;
  readonly setorOptions = this.setorFacade.options;

  readonly totalRecords = computed(() => this.facade.totalRecords());
  readonly tickets = computed<TicketModel[]>(() => this.facade.items());

  protected override readonly advancedActiveFilters = computed<ActiveFilterItem[]>(() => {
    const items: ActiveFilterItem[] = [];

    const status = this.status();
    const prioridade = this.prioridade();
    const categoriaId = this.categoriaId();
    const setorId = this.setorId();

    if (status?.length) {
      const labels = this.statusOptions()
        .filter((opt) => status.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.status' as never), value: labels });
    }
    if (prioridade?.length) {
      const labels = this.priorityOptions()
        .filter((opt) => prioridade.includes(opt.value))
        .map((opt) => opt.label)
        .join(', ');
      items.push({ label: this.i18n.tUi('tickets.fields.prioridade' as never), value: labels });
    }
    if (categoriaId) {
      const label = this.categoryOptions().find((opt) => opt.value === categoriaId)?.label ?? categoriaId;
      items.push({ label: this.i18n.tUi('tickets.fields.categoria' as never), value: label });
    }
    if (setorId) {
      const label = this.setorOptions().find((opt) => opt.value === setorId)?.label ?? setorId;
      items.push({ label: this.i18n.tUi('tickets.fields.setor' as never), value: label });
    }

    return items;
  });

  ngOnInit() {
    this.categoryFacade.loadOptions();
    this.setorFacade.loadOptions();
    if (!this.isScopeAllowed(this.scope())) {
      this.scope.set('mine');
    }
    this.initStatefulList();

    // Atualiza a lista sozinha quando um chamado é criado/modificado em qualquer aba/sessão (SSE,
    // ver TicketEventsService) - sem precisar de "Atualizar" manual. Debounce pra não recarregar
    // em rajada se várias mudanças acontecerem quase juntas; reaproveita #refresh (mesmo botão
    // "Atualizar"), preserva filtro/página/ordenação atuais - não perde nada que o usuário já
    // estava fazendo (ex. diálogo de "Novo chamado" aberto continua intocado, é outro componente).
    this.ticketEvents.events$
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());
  }

  /** "all" exige CHAMADO_CONSULT, "queue" exige CHAMADO_MANAGE - os outros 3 escopos nunca
   *  precisam de permissão (ver PROJECT_SPEC.md). */
  private isScopeAllowed(scope: TicketsScope): boolean {
    if (scope === 'all') return this.canToggleScope();
    if (scope === 'queue') return this.canSeeQueue();
    return true;
  }

  tone(status: string): ReturnType<typeof ticketStatusTone> {
    return ticketStatusTone(status);
  }

  priorityTone(priority: string): ReturnType<typeof ticketPriorityTone> {
    return ticketPriorityTone(priority);
  }

  isOverdue(row: TicketModel): boolean {
    return isTicketSlaOverdue(row);
  }

  onScopeChange(value: TicketsScope): void {
    if (!this.isScopeAllowed(value)) return;
    this.scope.set(value);
    this.search();
  }

  /** Fila de atendimento - assume o chamado pra si (mesmo endpoint PUT .../assign da tela de
   *  detalhe, só que direto da lista, sem precisar navegar). Recarrega a lista ao final (o
   *  chamado assumido sai da fila, já que deixa de estar sem responsável). */
  assignToMe(row: TicketModel): void {
    const userId = this.perms.currentUserId();
    if (!userId || this.assigningToMeId()) return;

    this.assigningToMeId.set(row.id);
    this.facade
      .assign(row.id, { responsavelId: userId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assigningToMeId.set(null);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.action.assigned' as never),
          });
          this.refresh();
        },
        error: () => {
          this.assigningToMeId.set(null);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.action.assignError' as never),
          });
        },
      });
  }

  goNew(): void {
    this.createVisible.set(true);
  }

  onCreateVisibleChange(visible: boolean): void {
    this.createVisible.set(visible);
  }

  /** O diálogo já navega pro detalhe do chamado recém-criado - só recarrega a lista aqui pra ela
   *  já vir atualizada se o usuário voltar com o botão "voltar" do navegador. */
  onCreated(): void {
    this.refresh();
  }

  goDetail(row: TicketModel): void {
    void this.router.navigate(['/tickets', row.id]);
  }

  clear(): void {
    this.clearTableAndReload(this.dt);
  }

  protected formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(this.i18n.getLang(), { dateStyle: 'short' }).format(date);
  }

  protected override tableStateKey(): string {
    return STATE_KEY.NIMBUSDESK.TICKETS.TABLE.STATE.V1;
  }

  protected override tableRowsKey(): string {
    return STATE_KEY.NIMBUSDESK.TICKETS.TABLE.ROWS.V1;
  }

  protected override filtersKey(): string {
    return STATE_KEY.NIMBUSDESK.TICKETS.FILTERS.V1;
  }

  protected override refresh(): void {
    this.reloadWithCurrentState();
  }

  /** Chamados "ainda vivos" (mesmo conjunto de TICKET_OPEN_STATUSES, usado pro cálculo de SLA
   *  estourado) - vem pré-selecionado só quando o painel INTEIRO está vazio (nem restaurado do
   *  localStorage, nem definido pelo usuário), mesmo padrão já usado no CardSync/NimbusFlow/
   *  NimbusNovax (ver applyDefaultAdvancedFiltersIfEmpty em StatefulListPage). */
  private defaultStatus(): string[] {
    return [...TICKET_OPEN_STATUSES];
  }

  protected override applyDefaultAdvancedFilters(): void {
    this.status.set(this.defaultStatus());
  }

  protected override resetFilters(): void {
    this.status.set(null);
    this.prioridade.set(null);
    this.categoriaId.set(null);
    this.setorId.set(null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override toFiltersState(): TicketsFiltersState {
    return {
      scope: this.scope(),
      status: this.status()?.length ? this.status() : null,
      prioridade: this.prioridade()?.length ? this.prioridade() : null,
      categoriaId: this.categoriaId(),
      setorId: this.setorId(),
    };
  }

  protected override applyFiltersState(state: TicketsFiltersState): void {
    const restored = state.scope ?? 'mine';
    this.scope.set(this.isScopeAllowed(restored) ? restored : 'mine');
    this.status.set(state.status ?? null);
    this.prioridade.set(state.prioridade ?? null);
    this.categoriaId.set(state.categoriaId ?? null);
    this.setorId.set(state.setorId ?? null);
    this.applyDefaultAdvancedFiltersIfEmpty();
  }

  protected override buildAdvancedFilters(): Partial<TicketsAdvancedFilters> {
    return {
      scope: this.scope(),
      status: this.status()?.length ? this.status() : undefined,
      prioridade: this.prioridade()?.length ? this.prioridade() : undefined,
      categoriaId: this.categoriaId() ?? undefined,
      setorId: this.setorId() ?? undefined,
    };
  }

  protected override mapTableFiltersToActiveItems(
    filters: Record<string, unknown>,
  ): ActiveFilterItem[] {
    this.i18n.getAppliedLang();

    const items: ActiveFilterItem[] = [];

    const statusValues = readArrayFilterValues(filters, 'status');
    if (statusValues.length) {
      const labels = this.statusOptions()
        .filter((option) => statusValues.includes(option.value))
        .map((option) => option.label);
      items.push({
        label: this.i18n.tUi('tickets.fields.status' as never),
        value: (labels.length ? labels : statusValues).join(', '),
      });
    }

    const categoriaId = readSingleFilterValue(filters, 'categoriaId');
    if (categoriaId) {
      items.push({ label: this.i18n.tUi('tickets.fields.categoria' as never), value: categoriaId });
    }

    return items;
  }

  protected override loadPage(
    query: ReturnType<typeof buildListQuery<TicketsAdvancedFilters>>,
  ): void {
    this.facade.loadPage(query);
  }

  // reload dessa lista já é disparado pelo effect() de filtros da própria StatefulListPage, não
  // precisa de lógica extra aqui.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected override loadFirstPage(): void {}
}
