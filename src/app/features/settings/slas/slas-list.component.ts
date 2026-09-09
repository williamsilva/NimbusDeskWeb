import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { SlaModel } from '@models/sla.models';
import { SlaFacade } from '@features/facade/sla.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { SlaFormDialogComponent } from './sla-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-slas-list',
  templateUrl: './slas-list.component.html',
  imports: [
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    SlaFormDialogComponent,
  ],
})
export class SlasListComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly facade = inject(SlaFacade);
  private readonly perms = inject(PermissionService);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<SlaModel | null>(null);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.SLA.MANAGE));

  ngOnInit(): void {
    this.facade.load();
  }

  goNew(): void {
    if (!this.canChange()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: SlaModel): void {
    if (!this.canChange()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }
}
