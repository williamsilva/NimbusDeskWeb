import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { I18nService } from '@core/i18n/i18n.service';
import { PERMISSIONS } from '@core/auth/permissions.constants';
import { PermissionService } from '@core/auth/permission.service';
import { CategoryModel } from '@models/category.models';
import { CategoryFacade } from '@features/facade/category.facade';
import { PageHeaderComponent } from '@shared/features/page-header/page-header.component';
import { CategoriaFormDialogComponent } from './categoria-form-dialog.component';

@Component({
  standalone: true,
  selector: 'app-categorias-list',
  templateUrl: './categorias-list.component.html',
  imports: [
    TagModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    TranslateModule,
    PageHeaderComponent,
    CategoriaFormDialogComponent,
  ],
})
export class CategoriasListComponent implements OnInit {
  readonly i18n = inject(I18nService);
  readonly facade = inject(CategoryFacade);
  private readonly perms = inject(PermissionService);

  readonly items = computed(() => this.facade.items());
  readonly loading = computed(() => this.facade.loading());
  readonly loadedOnce = computed(() => this.facade.loadedOnce());

  readonly formVisible = signal(false);
  readonly editing = signal<CategoryModel | null>(null);

  readonly canChange = computed(() => this.perms.hasSupportOr(PERMISSIONS.CATEGORIA.MANAGE));

  ngOnInit(): void {
    this.facade.load();
  }

  goNew(): void {
    if (!this.canChange()) return;
    this.editing.set(null);
    this.formVisible.set(true);
  }

  goEdit(row: CategoryModel): void {
    if (!this.canChange()) return;
    this.editing.set(row);
    this.formVisible.set(true);
  }

  onFormVisibleChange(v: boolean): void {
    this.formVisible.set(v);
  }
}
