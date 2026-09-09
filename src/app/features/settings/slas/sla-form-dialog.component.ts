import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { SlaFacade } from '@features/facade/sla.facade';
import { SlaModel } from '@models/sla.models';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';

@Component({
  standalone: true,
  selector: 'app-sla-form-dialog',
  templateUrl: './sla-form-dialog.component.html',
  imports: [
    DialogModule,
    ButtonModule,
    TranslateModule,
    InputTextModule,
    InputNumberModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class SlaFormDialogComponent {
  visible = input.required<boolean>();
  editing = input.required<SlaModel | null>();

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(SlaFacade);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);

  readonly isEditing = computed(() => this.editing() != null);

  readonly form = this.fb.nonNullable.group({
    nome: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
    tempoRespostaMin: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    tempoResolucaoMin: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
  });

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
        tempoRespostaMin: current?.tempoRespostaMin ?? null,
        tempoResolucaoMin: current?.tempoResolucaoMin ?? null,
      });
    });
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
        detail: this.i18n.tUi('slas.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = {
      nome: v.nome,
      tempoRespostaMin: v.tempoRespostaMin!,
      tempoResolucaoMin: v.tempoResolucaoMin!,
    };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi((editingId ? 'slas.form.updated' : 'slas.form.created') as never),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('slas.form.saveError' as never),
        });
      },
    });
  }
}
