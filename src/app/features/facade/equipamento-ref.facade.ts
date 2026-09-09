import { Injectable, inject, signal } from '@angular/core';

import { SelectOption } from '@models/select-option.model';
import { EquipamentoRefApiService } from '@features/service/equipamento-ref.api.service';

/** Só o necessário pro autocomplete opcional de equipamento no formulário de abertura de chamado -
 *  sem tela de gerenciamento (EquipamentoRef é só leitura pelo app, ver PROJECT_SPEC.md). */
@Injectable({ providedIn: 'root' })
export class EquipamentoRefFacade {
  private readonly api = inject(EquipamentoRefApiService);

  private readonly _options = signal<SelectOption<string>[]>([]);
  private readonly _optionsLoadedOnce = signal(false);

  readonly options = this._options.asReadonly();

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
}
