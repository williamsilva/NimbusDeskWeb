import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { SetorModel } from '@models/setor.models';
import { UserMinimalModel } from '@models/user-minimal.models';
import { SetorFacade } from '@features/facade/setor.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { SetorFormDialogComponent } from './setor-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-setores-ti-list',
  templateUrl: './setores-ti-list.component.html',
  imports: [
    TagModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    SetorFormDialogComponent,
  ],
})
export class SetoresTiListComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly facade = inject(SetorFacade);
  private readonly perms = inject(PermissionService);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<SetorModel | null>(null);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.SETOR_TI.MANAGE));

  ngOnInit(): void {
    this.facade.load();
  }

  userNames(users: UserMinimalModel[]): string {
    return users.map((u) => u.name).join(', ') || '-';
  }

  goNew(): void {
    if (!this.canChange()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: SetorModel): void {
    if (!this.canChange()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }
}
