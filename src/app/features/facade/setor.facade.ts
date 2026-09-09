import { Injectable, inject, signal } from '@angular/core';

import { Observable, finalize, tap } from 'rxjs';

import { SelectOption } from '@models/select-option.model';
import { SetorApiService } from '@features/service/setor.api.service';
import { SetorModel, SetorUpsertInput } from '@models/setor.models';

@Injectable({ providedIn: 'root' })
export class SetorFacade {
  private readonly api = inject(SetorApiService);

  private readonly _loading = signal(false);
  private readonly _loadedOnce = signal(false);
  private readonly _items = signal<SetorModel[]>([]);

  private readonly _options = signal<SelectOption<string>[]>([]);
  private readonly _optionsLoadedOnce = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly loadedOnce = this._loadedOnce.asReadonly();
  readonly items = this._items.asReadonly();
  readonly options = this._options.asReadonly();

  load(): void {
    this._loading.set(true);

    this.api
      .list()
      .pipe(
        finalize(() => {
          this._loading.set(false);
          this._loadedOnce.set(true);
        }),
      )
      .subscribe({
        next: (items) => this._items.set(items),
        error: () => this._items.set([]),
      });
  }

  /** Pro seletor de Setor no formulário de abertura de chamado. */
  loadOptions(force = false): void {
    if (!force && this._optionsLoadedOnce()) return;

    this.api.options().subscribe({
      next: (items) => {
        this._options.set(items);
        this._optionsLoadedOnce.set(true);
      },
      error: () => {
        this._options.set([]);
        this._optionsLoadedOnce.set(true);
      },
    });
  }

  create(input: SetorUpsertInput): Observable<SetorModel> {
    return this.api.create(input).pipe(tap(() => this.load()));
  }

  update(id: string, input: SetorUpsertInput): Observable<SetorModel> {
    return this.api.update(id, input).pipe(tap(() => this.load()));
  }
}
