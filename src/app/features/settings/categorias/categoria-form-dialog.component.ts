import { DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter, OnInit } from '@angular/core';

import { MessageService } from 'primeng/api';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { SlaFacade } from '@features/facade/sla.facade';
import { CategoryModel } from '@models/category.models';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';
import { CategoryFacade } from '@features/facade/category.facade';
import { autoSelectSingleOption } from '@shared/utils/auto-select-single-option.util';

@Component({
  standalone: true,
  selector: 'app-categoria-form-dialog',
  templateUrl: './categoria-form-dialog.component.html',
  imports: [
    FormsModule,
    SelectModule,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    TranslateModule,
    InputTextModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class CategoriaFormDialogComponent implements OnInit {
  visible = input.required<boolean>();
  editing = input.required<CategoryModel | null>();

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(CategoryFacade);

  readonly i18n = inject(I18nService);
  readonly slaFacade = inject(SlaFacade);
  readonly saving = signal(false);

  readonly isEditing = computed(() => this.editing() != null);
  readonly slaOptions = this.slaFacade.options;

  readonly form = this.fb.nonNullable.group({
    nome: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
    slaId: this.fb.control<string | null>(null, [Validators.required]),
    ativo: this.fb.nonNullable.control<boolean>(true),
  });

  /** 2026-09-09: pré-seleciona o SLA quando só há 1 cadastrado (ver
   *  auto-select-single-option.util.ts). */
  private readonly autoSelect = autoSelectSingleOption([
    { options: this.slaOptions, control: this.form.controls.slaId },
  ]);

  private lastLoadedKey: string | null = null;

  constructor() {
    effect(() => {
      if (!this.visible()) {
        this.lastLoadedKey = null;
        return;
      }

      const current = this.editing();
      const key = current?.id ?? 'CREATE';
      if (this.lastLoadedKey === key) return;
      this.lastLoadedKey = key;

      this.form.reset({
        nome: current?.nome ?? '',
        slaId: current?.slaId ?? null,
        ativo: current?.ativo ?? true,
      });
      // untracked() aqui é essencial - sem isso, slaOptions() vira dependência DESTE effect (que
      // só deveria reagir a visible()/editing()), e o effect volta a rodar (resetando o form de
      // novo) toda vez que a lista de SLAs carregar/mudar (mesma classe de bug já documentada em
      // TicketsCreateDialogComponent - ver constructor de lá).
      untracked(() => this.autoSelect.applyNow());
    });
  }

  ngOnInit(): void {
    this.slaFacade.loadOptions();
  }

  onHide(): void {
    this.close();
  }

  close(): void {
    this.saving.set(false);
    this.visibleChange.emit(false);
  }

  save(): void {
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    if (this.form.invalid) {
      this.toast.add({
        severity: 'warn',
        summary: this.i18n.tUi('common.warning'),
        detail: this.i18n.tUi('categorias.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = { nome: v.nome, slaId: v.slaId!, ativo: v.ativo };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi((editingId ? 'categorias.form.updated' : 'categorias.form.created') as never),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('categorias.form.saveError' as never),
        });
      },
    });
  }
}
