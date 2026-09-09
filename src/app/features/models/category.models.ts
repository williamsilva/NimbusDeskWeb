/** Espelha com.nimbusdesk.tickets.model.Category / dto.response.CategoryResponse do NimbusDeskServer
 *  - lista pequena, sem paginação (mesma premissa de Department no NimbusFlow). `slaId` define o SLA
 *  aplicado ao chamado (dataLimiteSla é derivada dele na abertura, não escolhida manualmente). */
export interface CategoryModel {
  id: string;
  nome: string;
  slaId: string;
  slaNome: string | null;
  ativo: boolean;
}

export type CategoryApiModel = CategoryModel;

export interface CategoryUpsertInput {
  nome: string;
  slaId: string;
  ativo: boolean;
}

export function mapCategoryApiModel(input: CategoryApiModel): CategoryModel {
  return { ...input, ativo: input.ativo ?? true };
}

export function mapCategoryApiModels(items: CategoryApiModel[] | null | undefined): CategoryModel[] {
  return (items ?? []).map(mapCategoryApiModel);
}
