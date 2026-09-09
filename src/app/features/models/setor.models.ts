import { UserMinimalModel } from '@models/user-minimal.models';

/** Espelha com.nimbusdesk.tickets.model.Setor / dto.response.SetorResponse do NimbusDeskServer -
 *  mesmo desenho do Department do NimbusFlow (ver PROJECT_SPEC.md): lista pequena, sem paginação,
 *  userIds crus + users já resolvidos pelo backend (UserDirectoryService) pra exibição. */
export interface SetorModel {
  id: string;
  nome: string;
  userIds: string[];
  users: UserMinimalModel[];
  ativo: boolean;
}

export type SetorApiModel = SetorModel;

export interface SetorUpsertInput {
  nome: string;
  userIds: string[];
  ativo: boolean;
}

export function mapSetorApiModel(input: SetorApiModel): SetorModel {
  return { ...input, userIds: input.userIds ?? [], users: input.users ?? [], ativo: input.ativo ?? true };
}

export function mapSetorApiModels(items: SetorApiModel[] | null | undefined): SetorModel[] {
  return (items ?? []).map(mapSetorApiModel);
}
