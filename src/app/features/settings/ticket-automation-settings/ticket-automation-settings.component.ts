import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputNumberModule } from 'primeng/inputnumber';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { TicketAutomationSettingsApiService } from '@features/service/ticket-automation-settings.api.service';

/**
 * Configurações > Automação de chamados (2026-09-09, pedido do usuário) - periodicidade (em dias)
 * dos 3 jobs de automação: alerta de chamado sem responsável, alerta de pendência de resposta, e
 * auto-fechamento (com carência própria, confirmada via AskUserQuestion). Tela única (não 3
 * separadas) - as 3 automações são facetas do mesmo concern (ver TicketAutomationSettings no
 * backend), mesmo padrão de formulário único de EmailSettingsComponent, só sem segredo mascarado
 * (são só inteiros).
 */
@Component({
  standalone: true,
  selector: 'app-ticket-automation-settings',
  templateUrl: './ticket-automation-settings.component.html',
  imports: [
    CardModule,
    ButtonModule,
    DividerModule,
    TooltipModule,
    TranslateModule,
    FloatLabelModule,
    InputNumberModule,
    ReactiveFormsModule,
    PageHeaderComponent,
  ],
})
export class TicketAutomationSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(MessageService);
  private readonly perms = inject(PermissionService);
  private readonly service = inject(TicketAutomationSettingsApiService);

  protected readonly saving = signal(false);
  protected readonly loading = signal(false);

  protected readonly canEdit = computed(() =>
    this.perms.hasSupportOr(PERMISSIONS.TICKET_AUTOMATION.MANAGE),
  );

  readonly form = this.fb.nonNullable.group({
    unassignedAlertPeriodicidadeDias: this.fb.control<number | null>(1, [Validators.required, Validators.min(1), Validators.max(365)]),
    pendingResponseAlertPeriodicidadeDias: this.fb.control<number | null>(1, [Validators.required, Validators.min(1), Validators.max(365)]),
    autoClosePeriodicidadeDias: this.fb.control<number | null>(1, [Validators.required, Validators.min(1), Validators.max(365)]),
    autoCloseCarenciaDias: this.fb.control<number | null>(5, [Validators.required, Validators.min(1), Validators.max(365)]),
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.service.getSettings().subscribe({
      next: (s) => {
        this.form.patchValue({
          unassignedAlertPeriodicidadeDias: s.unassignedAlertPeriodicidadeDias,
          pendingResponseAlertPeriodicidadeDias: s.pendingResponseAlertPeriodicidadeDias,
          autoClosePeriodicidadeDias: s.autoClosePeriodicidadeDias,
          autoCloseCarenciaDias: s.autoCloseCarenciaDias,
        });
        if (!this.canEdit()) {
          this.form.disable();
        }
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    this.saving.set(true);
    this.service
      .updateSettings({
        unassignedAlertPeriodicidadeDias: v.unassignedAlertPeriodicidadeDias!,
        pendingResponseAlertPeriodicidadeDias: v.pendingResponseAlertPeriodicidadeDias!,
        autoClosePeriodicidadeDias: v.autoClosePeriodicidadeDias!,
        autoCloseCarenciaDias: v.autoCloseCarenciaDias!,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'success',
            summary: this.i18n.tUi('common.success'),
            detail: this.i18n.tUi('ticketAutomation.settings.saved' as never),
          });
        },
        error: () => {
          this.saving.set(false);
          this.toast.add({
            severity: 'error',
            summary: this.i18n.tUi('common.error'),
            detail: this.i18n.tUi('ticketAutomation.settings.saveError' as never),
          });
        },
      });
  }
}
