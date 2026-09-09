import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import {
  SetorApiModel,
  SetorUpsertInput,
  mapSetorApiModel,
  mapSetorApiModels,
} from '@models/setor.models';

interface SetorOptionApiModel {
  id: string;
  nome: string;
}

/** Configurações > Setores de TI - lista pequena, sem paginação (mesmo padrão de
 *  DepartmentsApiService no NimbusFlow). */
@Injectable({ providedIn: 'root' })
export class SetorApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/setores`;

  list() {
    return this.http.get<SetorApiModel[]>(this.baseUrl).pipe(map(mapSetorApiModels));
  }

  /** Pro seletor de Setor no formulário de abertura de chamado - sem gate de permissão. */
  options() {
    return this.http
      .get<SetorOptionApiModel[]>(`${this.baseUrl}/options`)
      .pipe(
        map((items): SelectOption<string>[] => (items ?? []).map((s) => ({ label: s.nome, value: s.id }))),
      );
  }

  create(input: SetorUpsertInput) {
    return this.http.post<SetorApiModel>(this.baseUrl, input).pipe(map(mapSetorApiModel));
  }

  update(id: string, input: SetorUpsertInput) {
    return this.http.put<SetorApiModel>(`${this.baseUrl}/${id}`, input).pipe(map(mapSetorApiModel));
  }
}
