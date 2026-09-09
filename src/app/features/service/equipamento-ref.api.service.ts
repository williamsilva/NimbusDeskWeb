import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import { EquipamentoRefApiModel, mapEquipamentoRefApiModels } from '@models/equipamento-ref.models';

interface EquipamentoRefOptionApiModel {
  id: string;
  codigo: string;
  nome: string;
}

/** Só leitura pelo app - escrita é exclusiva do EquipamentoSyncService (job) no backend, ver
 *  PROJECT_SPEC.md. */
@Injectable({ providedIn: 'root' })
export class EquipamentoRefApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/equipamento-refs`;

  list() {
    return this.http
      .get<EquipamentoRefApiModel[]>(this.baseUrl)
      .pipe(map(mapEquipamentoRefApiModels));
  }

  /** Pro autocomplete de equipamento no formulário de abertura de chamado (opcional). */
  options() {
    return this.http.get<EquipamentoRefOptionApiModel[]>(`${this.baseUrl}/options`).pipe(
      map(
        (items): SelectOption<string>[] =>
          (items ?? []).map((e) => ({ label: `${e.codigo} - ${e.nome}`, value: e.id })),
      ),
    );
  }
}
