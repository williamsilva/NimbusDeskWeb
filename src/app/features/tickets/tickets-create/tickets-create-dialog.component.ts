import { DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  input,
  signal,
  Output,
  inject,
  computed,
  untracked,
  Component,
  EventEmitter,
  effect,
} from '@angular/core';

import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TranslateModule } from '@ngx-translate/core';
import { MultiSelectModule } from 'primeng/multiselect';

import { I18nService } from '@core/i18n/i18n.service';
import { UsersFacade } from '@features/facade/users.facade';
import { TicketsFacade } from '@features/facade/tickets.facade';
import { SetorFacade } from '@features/facade/setor.facade';
import { TicketModel } from '@features/models/tickets.models';
import { PermissionService } from '@core/auth/permission.service';
import { CategoryFacade } from '@features/facade/category.facade';
import { richTextRequired } from '@shared/validators/rich-text.validator';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { RichTextEditorComponent } from '@shared/rich-text/rich-text-editor.component';
import { autoSelectSingleOption } from '@shared/utils/auto-select-single-option.util';
import { EquipamentoRefFacade } from '@features/facade/equipamento-ref.facade';
import { TicketPriorityEnum, TICKET_PRIORITY_VALUES } from '@models/enums/ticket-priority.enum';

/**
 * Diálogo modal (mesmo padrão de GroupsCreateDialogComponent/CategoriasCreateDialogComponent) -
 * substituiu a rota cheia /tickets/novo (decisão original documentada no relatório da feature,
 * revertida em 2026-09-08 a pedido do usuário: a tela de Chamados deve seguir o mesmo padrão do
 * resto do app - lista com botão que abre modal, não navegação pra página separada). Só cria (sem
 * modo de edição - editar título/descrição/categoria/setor/equipamento de um chamado ABERTO é
 * feito na tela de detalhe, TicketDetailComponent).
 */
@Component({
  standalone: true,
  selector: 'app-tickets-create-dialog',
  templateUrl: './tickets-create-dialog.component.html',
  imports: [
    CardModule,
    ChipModule,
    ToastModule,
    DialogModule,
    SelectModule,
    ButtonModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    MultiSelectModule,
    ReactiveFormsModule,
    RichTextEditorComponent,
  ],
})
export class TicketsCreateDialogComponent {
  visible = input.required<boolean>();

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() created = new EventEmitter<TicketModel>();

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly perms = inject(PermissionService);
  private readonly ticketsFacade = inject(TicketsFacade);

  readonly i18n = inject(I18nService);
  readonly usersFacade = inject(UsersFacade);
  readonly categoryFacade = inject(CategoryFacade);
  readonly setorFacade = inject(SetorFacade);
  readonly equipamentoRefFacade = inject(EquipamentoRefFacade);

  readonly saving = signal(false);
  readonly selectedFiles = signal<File[]>([]);

  readonly categoryOptions = this.categoryFacade.options;
  readonly setorOptions = this.setorFacade.options;
  readonly equipamentoOptions = this.equipamentoRefFacade.options;
  /** 2026-09-09: prioridade informada pelo solicitante na abertura - antes vinha só do extinto
   *  {@code prioridadeDefault} da categoria/SLA escolhida, sem o usuário poder opinar. */
  readonly priorityOptions = computed(() => {
    this.i18n.getAppliedLang();
    return TICKET_PRIORITY_VALUES.map((value) => ({
      value,
      label: this.i18n.tUi(`tickets.priority.${value}` as never),
    }));
  });
  /** "Compartilhado com" já na abertura (2026-09-08) - o próprio usuário que está abrindo o
   *  chamado (o futuro solicitante) nunca aparece aqui: não faz sentido ser participante do
   *  próprio chamado, já é "meu chamado" por definição (mesmo racional do backend, ver
   *  TicketService#saveParticipants). */
  readonly participantOptions = computed(() => {
    const currentUserId = this.perms.currentUserId();
    return this.usersFacade.options().filter((opt) => opt.value !== currentUserId);
  });

  /** 2026-09-08: {@code descricao} maxLength 2000 (não 4000 - estava descasado do backend, ver
   *  com.nimbusdesk.tickets.dto.request.TicketRequest#descricao); {@code richTextRequired} no
   *  lugar de Validators.required (ver rich-text.validator.ts) - o editor rico (p-editor/Quill)
   *  nunca escreve string vazia, escreve {@code <p><br></p>}. */
  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descricao: ['', [richTextRequired, Validators.maxLength(2000)]],
    categoriaId: this.fb.control<string | null>(null, [Validators.required]),
    setorId: this.fb.control<string | null>(null),
    equipamentoRefId: this.fb.control<string | null>(null),
    participantIds: this.fb.nonNullable.control<string[]>([]),
    prioridade: this.fb.control<TicketPriorityEnum | null>(null, [Validators.required]),
  });

  /** 2026-09-09: pré-seleciona categoria/setor/equipamento quando só há 1 opção cadastrada (ver
   *  auto-select-single-option.util.ts) - "prioridade" fica de fora (sempre 4 opções fixas do
   *  enum, nunca cai pra 1). */
  private readonly autoSelect = autoSelectSingleOption([
    { options: this.categoryOptions, control: this.form.controls.categoriaId },
    { options: this.setorOptions, control: this.form.controls.setorId },
    { options: this.equipamentoOptions, control: this.form.controls.equipamentoRefId },
  ]);

  constructor() {
    /**
     * BUG REAL corrigido em 2026-09-08 (mesma classe do já visto em WorksCreateDialogComponent,
     * ver memória do projeto): `loadOptions()` de cada facade lê o próprio signal de guarda
     * (`_optionsLoadedOnce`) ANTES de decidir se dispara o HTTP. Sem `untracked()`, o
     * `effect()` do Angular rastreia TODO signal lido durante sua execução - inclusive os lidos
     * dentro de métodos chamados, não só os lidos diretamente aqui. Isso fazia o
     * `_optionsLoadedOnce.set(true)` (disparado no `subscribe` assíncrono, ao terminar o
     * carregamento) virar uma dependência do efeito - e qualquer troca de valor nesse signal
     * disparava o efeito de novo, chamando `resetForm()` e limpando tudo que o usuário já tinha
     * digitado. Sintoma relatado: "form limpa ao clicar em qualquer select" - na prática o reset
     * disparava pouco depois de abrir o diálogo (assim que o load assíncrono terminava), o que
     * coincidia por acaso com o primeiro clique do usuário num campo.
     */
    effect(() => {
      if (!this.visible()) return;
      untracked(() => {
        // Opções carregadas toda vez que o diálogo abre (mesma cautela de "opções
        // desatualizadas" já aplicada em outros diálogos de criação do app - facades cacheadas
        // sem TTL).
        this.categoryFacade.loadOptions();
        this.setorFacade.loadOptions();
        this.equipamentoRefFacade.loadOptions();
        this.usersFacade.loadUsersOptions();
        this.resetForm();
        this.autoSelect.applyNow();
      });
    });
  }

  /** Acumula com o que já estava selecionado (achado real 2026-09-17: reabrir o seletor pra
   *  anexar mais um arquivo substituía a seleção anterior inteira, não somava) - resetar
   *  `input.value` depois é o que permite selecionar de novo o MESMO arquivo caso o usuário
   *  remova e queira readicionar (sem isso o `change` não dispara duas vezes pro mesmo arquivo). */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const newFiles = input.files ? Array.from(input.files) : [];
    this.selectedFiles.update((files) => [...files, ...newFiles]);
    input.value = '';
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  private resetForm(): void {
    this.form.reset({
      titulo: '',
      descricao: '',
      categoriaId: null,
      setorId: null,
      equipamentoRefId: null,
      participantIds: [],
      prioridade: null,
    });
    this.selectedFiles.set([]);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('tickets.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();
    this.saving.set(true);

    this.ticketsFacade
      .create({
        titulo: v.titulo.trim(),
        descricao: v.descricao.trim(),
        categoriaId: v.categoriaId!,
        setorId: v.setorId,
        equipamentoRefId: v.equipamentoRefId,
        attachments: this.selectedFiles(),
        participantIds: v.participantIds,
        prioridade: v.prioridade!,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (createdTicket) => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('tickets.form.created' as never),
          });
          this.created.emit(createdTicket);
          this.close();
          void this.router.navigate(['/tickets', createdTicket.id]);
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('tickets.form.saveError' as never),
          });
        },
      });
  }
}
