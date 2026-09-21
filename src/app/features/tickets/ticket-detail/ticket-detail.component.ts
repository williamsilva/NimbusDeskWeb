import { ActivatedRoute, Router } from '@angular/router';
import { DestroyRef, computed, inject, signal, Component, OnInit, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { debounceTime, filter } from 'rxjs/operators';

import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { I18nService } from '@core/i18n/i18n.service';
import { CsDatePipe } from '@shared/pipes/cs-date.pipe';
import { UsersFacade } from '@features/facade/users.facade';
import { SetorFacade } from '@features/facade/setor.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { CategoryFacade } from '@features/facade/category.facade';
import { richTextRequired } from '@shared/validators/rich-text.validator';
import { TicketEventsService } from '@features/service/ticket-events.service';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { RichTextEditorComponent } from '@shared/rich-text/rich-text-editor.component';
import { autoSelectSingleOption } from '@shared/utils/auto-select-single-option.util';
import { EquipamentoRefFacade } from '@features/facade/equipamento-ref.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TicketsPermissionPolicy } from '@features/tickets/tickets-permission.policy';
import { StatusBadgeComponent } from '@shared/features/status-badge/status-badge.component';
import {
  TicketStatusEnum,
  ticketStatusTone,
  isTicketStatusTerminal,
  ticketAllowedNextStatuses,
} from '@models/enums/ticket-status.enum';
import { TicketPriorityEnum, TICKET_PRIORITY_VALUES, ticketPriorityTone } from '@models/enums/ticket-priority.enum';
import { isTicketSlaOverdue } from '@models/tickets.models';
import { TicketCommentModel } from '@models/ticket-comment.models';

/** Grupo de quem comentou - usado só pra estilizar a bolha do comentário (cor+lado, ver
 *  ticket-detail.component.html/scss): "solicitante" e "participante" (compartilhado/em cópia)
 *  ficam do lado esquerdo, "ti" (responsável ou qualquer outro membro do T.I. que comentou) do
 *  lado direito - mesmo racional visual de chat, sem exigir nenhum dado novo do backend. */
export type TicketCommentGroup = 'solicitante' | 'participante' | 'ti';

@Component({
  standalone: true,
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.scss',
  imports: [
    CardModule,
    ChipModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    CsDatePipe,
    TooltipModule,
    CheckboxModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    MultiSelectModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    ProgressSpinnerModule,
    RichTextEditorComponent,
  ],
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ticketEvents = inject(TicketEventsService);

  readonly i18n = inject(I18nService);
  readonly facade = inject(TicketsFacade);
  readonly policy = inject(TicketsPermissionPolicy);
  readonly usersFacade = inject(UsersFacade);
  readonly categoryFacade = inject(CategoryFacade);
  readonly setorFacade = inject(SetorFacade);
  readonly equipamentoRefFacade = inject(EquipamentoRefFacade);

  private ticketId = '';

  readonly ticket = this.facade.ticket;
  readonly ticketLoading = this.facade.ticketLoading;
  readonly comments = this.facade.comments;
  /** Ordem vem ASC do backend (mais antigo primeiro) - "últimos 4" são os 4 finais do array. */
  readonly hasMoreComments = computed(() => this.comments().length > 4);
  readonly visibleComments = computed(() => {
    const all = this.comments();
    return this.commentsExpanded() || all.length <= 4 ? all : all.slice(-4);
  });
  readonly history = this.facade.history;
  readonly participants = this.facade.participants;
  readonly participantsSaving = this.facade.participantsSaving;

  readonly canManage = computed(() => this.policy.canManage());
  readonly canEdit = computed(() => {
    const ticket = this.ticket();
    return !!ticket && this.policy.canEdit(ticket);
  });
  /** CHAMADO_EDIT dedicada (2026-09-21, só ADMINISTRADOR) - só quem tem essa permissão pode
   *  alterar a prioridade na edição (ver #openEdit/tickets-permission.policy.ts#canEditAdmin). */
  readonly canEditPriority = computed(() => this.policy.canEditAdmin());
  readonly canManageParticipants = computed(() => {
    const ticket = this.ticket();
    return !!ticket && this.policy.canManageParticipants(ticket);
  });
  readonly isOverdue = computed(() => {
    const ticket = this.ticket();
    return !!ticket && isTicketSlaOverdue(ticket);
  });
  /** RESOLVIDO/FECHADO/CANCELADO não aceitam mais interação nenhuma (2026-09-08, decisão do
   *  usuário) - esconde o composer de comentário/anexo (ver template). Validação real de verdade
   *  é sempre server-side (TicketCommentService#add). */
  readonly canComment = computed(() => {
    const ticket = this.ticket();
    return !!ticket && !isTicketStatusTerminal(ticket.status);
  });
  /** {@code assign} só é permitido pelo backend saindo de ABERTO (é a ÚNICA forma de fazer
   *  ABERTO -> EM_ANDAMENTO, ver TicketService#assign) - esconde "Atribuir responsável" pra
   *  qualquer outro status, terminal ou não (antes só checava permissão, deixava tentar atribuir
   *  num chamado já em andamento/resolvido/fechado/cancelado e o backend recusava). */
  readonly canAssign = computed(() => {
    const ticket = this.ticket();
    return !!ticket && ticket.status === TicketStatusEnum.ABERTO;
  });

  readonly userOptions = this.usersFacade.options;
  /** "Atribuir responsável" (2026-09-09) - só usuários com CHAMADO_MANAGE (T.I.), diferente de
   *  #userOptions (todo usuário do NimbusDesk, inclusive SOLICITANTE - usado só em "Compartilhado
   *  com", ver #participantOptions). */
  readonly responsavelOptions = this.facade.responsavelOptions;
  /** "Compartilhado com" nunca deve oferecer o solicitante nem o responsável do próprio chamado -
   *  o backend já filtra isso silenciosamente ao salvar (ver TicketService#saveParticipants), mas
   *  deixar aparecer na lista e ser "aceito" pra depois sumir sem explicação é confuso (mesmo
   *  ajuste já feito em TicketsCreateDialogComponent#participantOptions, na abertura). */
  readonly participantOptions = computed(() => {
    const ticket = this.ticket();
    if (!ticket) return this.userOptions();
    return this.userOptions().filter(
      (opt) => opt.value !== ticket.solicitanteId && opt.value !== ticket.responsavelId,
    );
  });
  readonly categoryOptions = this.categoryFacade.options;
  readonly setorOptions = this.setorFacade.options;
  readonly equipamentoOptions = this.equipamentoRefFacade.options;

  readonly editMode = signal(false);
  /** Começa minimizado (2026-09-08, ajustado a pedido do usuário) - mesmo padrão de expandir/
   *  recolher clicando no cabeçalho do card usado em #historyExpanded. */
  readonly detailsExpanded = signal(false);
  /** Começa minimizado - histórico costuma ter várias entradas e não é o foco principal da tela
   *  (ver template: clique no cabeçalho do card "Histórico" alterna). */
  readonly historyExpanded = signal(false);
  readonly savingEdit = signal(false);
  readonly sendingComment = signal(false);
  /** Lista de comentários começa recolhida nos últimos 4 (2026-09-08, a pedido do usuário) -
   *  "Ver mais" revela o histórico completo. Uma vez expandido fica expandido (não recolhe
   *  sozinho ao enviar um comentário novo). */
  readonly commentsExpanded = signal(false);
  readonly changingStatus = signal(false);
  readonly assigning = signal(false);
  /** Anexos do PRÓXIMO comentário (não existe mais upload solto - ver PROJECT_SPEC.md/2026-09-08). */
  readonly commentAttachmentFiles = signal<File[]>([]);
  readonly editingParticipants = signal(false);
  selectedParticipantIds: string[] = [];

  readonly nextStatusOptions = computed(() => {
    this.i18n.getAppliedLang();
    const ticket = this.ticket();
    if (!ticket) return [];
    return ticketAllowedNextStatuses(ticket.status).map((value) => ({
      value,
      label: this.i18n.tUi(`tickets.status.${value}` as never),
    }));
  });

  selectedNextStatus: TicketStatusEnum | null = null;
  selectedResponsavelId: string | null = null;

  /** {@code descricao}: 2000 (não 4000 - era invertido com o de baixo antes deste ajuste,
   *  descasado do backend, ver com.nimbusdesk.tickets.dto.request.TicketRequest#descricao) -
   *  {@code richTextRequired} no lugar de Validators.required (ver rich-text.validator.ts): o
   *  editor rico (p-editor/Quill) nunca escreve string vazia, escreve {@code <p><br></p>}. */
  readonly editForm = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descricao: ['', [richTextRequired, Validators.maxLength(2000)]],
    categoriaId: this.fb.control<string | null>(null, [Validators.required]),
    setorId: this.fb.control<string | null>(null),
    equipamentoRefId: this.fb.control<string | null>(null),
    /** Só editável (habilitado) por quem tem CHAMADO_EDIT - ver #openEdit/#canEditPriority. Fica
     *  desabilitado (não omitido) pra quem não pode: o backend exige o campo no payload mesmo em
     *  edição (@NotNull), ver TicketUpsertInput#prioridade. */
    prioridade: this.fb.control<TicketPriorityEnum | null>(null, [Validators.required]),
  });

  /** Mesma fonte de opções da criação (TicketsCreateDialogComponent#priorityOptions). */
  readonly priorityOptions = computed(() => {
    this.i18n.getAppliedLang();
    return TICKET_PRIORITY_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`tickets.priority.${value}` as never),
    }));
  });

  /** 2026-09-09: pré-seleciona categoria/setor/equipamento quando só há 1 opção cadastrada (ver
   *  auto-select-single-option.util.ts) - "categoriaId" na prática nunca dispara aqui (chamado já
   *  existente sempre tem categoria), mas "setorId"/"equipamentoRefId" são opcionais e podem estar
   *  vazios no chamado. */
  private readonly autoSelect = autoSelectSingleOption([
    { options: this.categoryOptions, control: this.editForm.controls.categoriaId },
    { options: this.setorOptions, control: this.editForm.controls.setorId },
    { options: this.equipamentoOptions, control: this.editForm.controls.equipamentoRefId },
  ]);

  /** {@code mensagem}: 4000 (não 2000 - mesmo ajuste do #editForm acima, ver
   *  com.nimbusdesk.tickets.dto.request.TicketCommentRequest#mensagem). */
  readonly commentForm = this.fb.nonNullable.group({
    mensagem: ['', [richTextRequired, Validators.maxLength(4000)]],
    interno: [false],
  });

  ngOnInit(): void {
    this.categoryFacade.loadOptions();
    this.setorFacade.loadOptions();
    this.equipamentoRefFacade.loadOptions();
    this.usersFacade.loadUsersOptions();
    // Endpoint exige CHAMADO_MANAGE (ver TicketService#responsavelOptions) - chamar pra QUALQUER
    // usuário (ex.: SOLICITANTE sem essa permissão) gerava 403, e o interceptor global de erros
    // trata todo 403 como fatal (toast + redirect pra /forbidden), quebrando a navegação pra quem
    // só estava abrindo o próprio chamado pra ler. #canManage já é a mesma condição que decide se
    // a seção "Ações de gestão" (onde esse seletor vive) aparece na tela.
    if (this.canManage()) {
      this.facade.loadResponsavelOptions();
    }

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');
      if (!id) return;
      this.ticketId = id;
      this.loadAll();
    });

    // Atualiza sozinho (ticket/comentários/histórico) quando ESTE chamado muda em outra
    // aba/sessão (SSE, ver TicketEventsService) - só reage a eventos do chamado atual, pra não
    // gastar requisição à toa quando o evento é de outro chamado. Nunca mexe em editMode/
    // editingParticipants/commentForm/commentAttachmentFiles (ver #silentReload) - formulário de
    // edição, rascunho de comentário e seleção de participantes em andamento continuam intocados,
    // são signals/controls independentes do que é recarregado aqui.
    this.ticketEvents.events$
      .pipe(
        filter((e) => e.id === this.ticketId),
        debounceTime(500),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.silentReload());
  }

  ngOnDestroy(): void {
    this.facade.clearTicket();
  }

  private loadAll(): void {
    this.editMode.set(false);
    // Navegação pra um chamado DIFERENTE - o componente é reaproveitado pelo router (mesma rota,
    // só o :id muda), então esses 2 campos ficariam com o valor selecionado no chamado anterior se
    // não fossem limpos aqui (ex.: selecionou "Resolvido" no chamado A, navega pro chamado B que
    // não aceita mais nenhuma transição - o botão de aplicar ficava habilitado com um valor que
    // nem aparece mais no select). Nunca chamado por #silentReload (SSE) - ali seria disruptivo.
    this.selectedNextStatus = null;
    this.selectedResponsavelId = null;
    this.silentReload();
  }

  /** Só os dados de LEITURA - nunca reseta formulário/diálogo/seleção em andamento (ver
   *  ngOnInit). Reaproveitado tanto pela navegação inicial (#loadAll) quanto pelo auto-refresh via
   *  SSE (que não deve fechar o modo de edição nem limpar o que o usuário está digitando). */
  private silentReload(): void {
    this.facade.loadTicket(this.ticketId);
    this.facade.loadComments(this.ticketId);
    this.facade.loadHistory(this.ticketId);
  }

  tone(status: string): ReturnType<typeof ticketStatusTone> {
    return ticketStatusTone(status);
  }

  priorityTone(priority: string): ReturnType<typeof ticketPriorityTone> {
    return ticketPriorityTone(priority);
  }

  goBack(): void {
    void this.router.navigate(['/tickets']);
  }

  openEdit(): void {
    if (!this.canEdit()) return;
    const ticket = this.ticket();
    if (!ticket) return;

    this.editForm.reset({
      titulo: ticket.titulo,
      descricao: ticket.descricao,
      categoriaId: ticket.categoriaId,
      setorId: ticket.setorId,
      equipamentoRefId: ticket.equipamentoRefId,
      prioridade: ticket.prioridade,
    });
    if (this.canEditPriority()) {
      this.editForm.controls.prioridade.enable();
    } else {
      this.editForm.controls.prioridade.disable();
    }
    this.autoSelect.applyNow();
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  saveEdit(): void {
    this.editForm.markAllAsTouched();
    this.editForm.updateValueAndValidity();
    if (this.editForm.invalid) return;

    const v = this.editForm.getRawValue();
    this.savingEdit.set(true);

    this.facade
      .update(this.ticketId, {
        titulo: v.titulo.trim(),
        descricao: v.descricao.trim(),
        categoriaId: v.categoriaId!,
        setorId: v.setorId,
        equipamentoRefId: v.equipamentoRefId,
        prioridade: v.prioridade!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingEdit.set(false);
          this.editMode.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.form.updated' as never),
          });
        },
        error: () => {
          this.savingEdit.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.form.saveError' as never),
          });
        },
      });
  }

  applyStatusChange(): void {
    if (!this.selectedNextStatus) return;
    this.changingStatus.set(true);

    this.facade
      .changeStatus(this.ticketId, { novoStatus: this.selectedNextStatus })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.changingStatus.set(false);
          this.selectedNextStatus = null;
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.action.statusChanged' as never),
          });
        },
        error: () => {
          this.changingStatus.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.action.statusChangeError' as never),
          });
        },
      });
  }

  applyAssign(): void {
    if (!this.selectedResponsavelId) return;
    this.assigning.set(true);

    this.facade
      .assign(this.ticketId, { responsavelId: this.selectedResponsavelId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.assigning.set(false);
          this.selectedResponsavelId = null;
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.action.assigned' as never),
          });
        },
        error: () => {
          this.assigning.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.action.assignError' as never),
          });
        },
      });
  }

  /** Acumula com o que já estava selecionado (achado real 2026-09-17: reabrir o seletor pra
   *  anexar mais um arquivo substituía a seleção anterior inteira, não somava) - resetar
   *  `input.value` depois é o que permite selecionar de novo o MESMO arquivo caso o usuário
   *  remova e queira readicionar (sem isso o `change` não dispara duas vezes pro mesmo arquivo). */
  onCommentFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newFiles = input.files ? Array.from(input.files) : [];
    this.commentAttachmentFiles.update((files) => [...files, ...newFiles]);
    input.value = '';
  }

  removeCommentAttachment(index: number): void {
    this.commentAttachmentFiles.update((files) => files.filter((_, i) => i !== index));
  }

  /** Anexo só existe vinculado a um comentário (ver PROJECT_SPEC.md/2026-09-08) - envia junto,
   *  num único multipart (ver TicketsApiService.addComment). */
  sendComment(): void {
    this.commentForm.markAllAsTouched();
    if (this.commentForm.invalid) return;

    const v = this.commentForm.getRawValue();
    this.sendingComment.set(true);

    this.facade
      .addComment(this.ticketId, {
        mensagem: v.mensagem.trim(),
        interno: v.interno,
        attachments: this.commentAttachmentFiles(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sendingComment.set(false);
          this.commentForm.reset({ mensagem: '', interno: false });
          this.commentAttachmentFiles.set([]);
        },
        error: () => {
          this.sendingComment.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.comment.saveError' as never),
          });
        },
      });
  }

  downloadAttachment(attachmentId: string): void {
    this.facade
      .getAttachmentUrl(this.ticketId, attachmentId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res?.url) window.open(res.url, '_blank', 'noopener');
        },
        error: () => {
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.attachment.urlError' as never),
          });
        },
      });
  }

  openParticipantsEdit(): void {
    if (!this.canManageParticipants()) return;
    this.selectedParticipantIds = this.participants().map((p) => p.userId);
    this.editingParticipants.set(true);
  }

  cancelParticipantsEdit(): void {
    this.editingParticipants.set(false);
  }

  saveParticipants(): void {
    this.facade
      .updateParticipants(this.ticketId, this.selectedParticipantIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editingParticipants.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.participants.saved' as never),
          });
        },
        error: () => {
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.participants.saveError' as never),
          });
        },
      });
  }

  /** "solicitante" (autorId = ticket.solicitanteId) e "participante" (autorId em
   *  ticket.participantes) ficam de um lado do chat; qualquer outro autor (responsável ou outro
   *  membro do T.I. com permissão pra comentar) cai em "ti", do lado oposto. */
  commentGroup(c: TicketCommentModel): TicketCommentGroup {
    const ticket = this.ticket();
    if (!ticket) return 'ti';
    if (c.autorId === ticket.solicitanteId) return 'solicitante';
    if (ticket.participantes.some((p) => p.userId === c.autorId)) return 'participante';
    return 'ti';
  }

  formatBytes(bytes: number | null): string {
    if (bytes == null) return '-';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }
}
