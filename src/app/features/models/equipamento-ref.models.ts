/** Espelha com.nimbusdesk.tickets.model.EquipamentoRef / dto.response.EquipamentoRefResponse do
 *  NimbusDeskServer - cópia local só-leitura pelo app (escrita só pelo EquipamentoSyncService job,
 *  ver PROJECT_SPEC.md). `id` é o mesmo UUID do Equipamento de origem no NimbusFlow. */
export interface EquipamentoRefModel {
  id: string;
  codigo: string;
  nome: string;
  localizacao: string | null;
  statusOperacional: string | null;
  atualizadoEm: string | null;
  sincronizadoEm: string | null;
}

export type EquipamentoRefApiModel = EquipamentoRefModel;

export function mapEquipamentoRefApiModel(input: EquipamentoRefApiModel): EquipamentoRefModel {
  return { ...input };
}

export function mapEquipamentoRefApiModels(
  items: EquipamentoRefApiModel[] | null | undefined,
): EquipamentoRefModel[] {
  return (items ?? []).map(mapEquipamentoRefApiModel);
}
