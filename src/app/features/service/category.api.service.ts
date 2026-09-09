import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { map } from 'rxjs/operators';

import { API } from '@core/api/api.config';
import { SelectOption } from '@models/select-option.model';
import {
  CategoryApiModel,
  CategoryUpsertInput,
  mapCategoryApiModel,
  mapCategoryApiModels,
} from '@models/category.models';

interface CategoryOptionApiModel {
  id: string;
  nome: string;
}

/** Configurações > Categorias - lista pequena, sem paginação (mesmo padrão de
 *  DepartmentsApiService no NimbusFlow). */
@Injectable({ providedIn: 'root' })
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API.bff}/v1/categories`;

  list() {
    return this.http.get<CategoryApiModel[]>(this.baseUrl).pipe(map(mapCategoryApiModels));
  }

  /** Pro seletor de Categoria no formulário de abertura de chamado - sem gate de permissão. */
  options() {
    return this.http.get<CategoryOptionApiModel[]>(`${this.baseUrl}/options`).pipe(
      map(
        (items): SelectOption<string>[] =>
          (items ?? []).map((c) => ({ label: c.nome, value: c.id })),
      ),
    );
  }

  create(input: CategoryUpsertInput) {
    return this.http.post<CategoryApiModel>(this.baseUrl, input).pipe(map(mapCategoryApiModel));
  }

  update(id: string, input: CategoryUpsertInput) {
    return this.http
      .put<CategoryApiModel>(`${this.baseUrl}/${id}`, input)
      .pipe(map(mapCategoryApiModel));
  }
}
