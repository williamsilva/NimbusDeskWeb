import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import { SlaApiModel, SlaUpsertInput, mapSlaApiModel, mapSlaApiModels } from '@models/sla.models';

interface SlaOptionApiModel {
  id: string;
  nome: string;
}

/** Configurações > SLAs - lista pequena, sem paginação (mesmo padrão de DepartmentsApiService no
 *  NimbusFlow). */
@Injectable({ providedIn: 'root' })
export class SlaApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/slas`;

  list() {
    return this.http.get<SlaApiModel[]>(this.baseUrl).pipe(map(mapSlaApiModels));
  }

  /** Pro seletor de SLA no formulário de Categoria. */
  options() {
    return this.http
      .get<SlaOptionApiModel[]>(`${this.baseUrl}/options`)
      .pipe(
        map((items): SelectOption<string>[] => (items ?? []).map((s) => ({ label: s.nome, value: s.id }))),
      );
  }

  create(input: SlaUpsertInput) {
    return this.http.post<SlaApiModel>(this.baseUrl, input).pipe(map(mapSlaApiModel));
  }

  update(id: string, input: SlaUpsertInput) {
    return this.http.put<SlaApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapSlaApiModel));
  }
}
