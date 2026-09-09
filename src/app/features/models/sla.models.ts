/** Espelha com.nimbusdesk.tickets.model.Sla / dto.response.SlaResponse do NimbusDeskServer - lista
 *  pequena, sem paginação. `tempoRespostaMin`/`tempoResolucaoMin` em minutos (dataLimiteSla do
 *  chamado = dataAbertura + tempoResolucaoMin, ver PROJECT_SPEC.md). */
export interface SlaModel {
  id: string;
  nome: string;
  tempoRespostaMin: number;
  tempoResolucaoMin: number;
}

export type SlaApiModel = SlaModel;

export interface SlaUpsertInput {
  nome: string;
  tempoRespostaMin: number;
  tempoResolucaoMin: number;
}

export function mapSlaApiModel(input: SlaApiModel): SlaModel {
  return { ...input };
}

export function mapSlaApiModels(items: SlaApiModel[] | null | undefined): SlaModel[] {
  return (items ?? []).map(mapSlaApiModel);
}
