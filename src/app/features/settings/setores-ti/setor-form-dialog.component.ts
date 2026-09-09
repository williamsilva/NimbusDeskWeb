import { DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Output, Component, EventEmitter, OnInit } from '@angular/core';

import { MessageService } from 'primeng/api';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { FloatLabelModule } from 'primeng/floatlabel';

import { I18nService } from '@core/i18n/i18n.service';
import { SetorModel } from '@models/setor.models';
import { SetorFacade } from '@features/facade/setor.facade';
import { UsersApiService } from '@features/service/users.api.service';
import { UserOptionModel } from '@models/groups.models';
import { ErrorMsgComponent } from '@shared/error-msg/error-msg.component';

@Component({
  standalone: true,
  selector: 'app-setor-form-dialog',
  templateUrl: './setor-form-dialog.component.html',
  imports: [
    DialogModule,
    ButtonModule,
    CheckboxModule,
    TranslateModule,
    InputTextModule,
    MultiSelectModule,
    FloatLabelModule,
    ErrorMsgComponent,
    ReactiveFormsModule,
  ],
})
export class SetorFormDialogComponent implements OnInit {
  visible = input.required<boolean>();
  editing = input.required<SetorModel | null>();

  @Output() visibleChange = new EventEmitter<boolean>();

  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly facade = inject(SetorFacade);
  private readonly usersApi = inject(UsersApiService);

  readonly i18n = inject(I18nService);
  readonly saving = signal(false);
  readonly userOptions = signal<UserOptionModel[]>([]);

  readonly isEditing = computed(() => this.editing() != null);

  readonly form = this.fb.nonNullable.group({
    nome: this.fb.nonNullable.control<string>('', [Validators.required, Validators.maxLength(120)]),
    userIds: this.fb.nonNullable.control<string[]>([]),
    ativo: this.fb.nonNullable.control<boolean>(true),
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
        userIds: current?.userIds ?? [],
        ativo: current?.ativo ?? true,
      });
    });
  }

  ngOnInit(): void {
    this.usersApi.getOptions().subscribe({
      next: (items) => this.userOptions.set(items ?? []),
      error: () => this.userOptions.set([]),
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
        detail: this.i18n.tUi('setoresTi.form.invalid' as never),
      });
      return;
    }

    const v = this.form.getRawValue();
    const input = { nome: v.nome, userIds: v.userIds, ativo: v.ativo };

    this.saving.set(true);
    const editingId = this.editing()?.id;
    const request$ = editingId ? this.facade.update(editingId, input) : this.facade.create(input);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'success',
          summary: this.i18n.tUi('common.success'),
          detail: this.i18n.tUi((editingId ? 'setoresTi.form.updated' : 'setoresTi.form.created') as never),
        });
        this.close();
      },
      error: () => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: this.i18n.tUi('common.error'),
          detail: this.i18n.tUi('setoresTi.form.saveError' as never),
        });
      },
    });
  }
}
