/**
 * Rótulos livres (String, sem enum fixo no backend - ver EmailSenderService.Message.eventType) -
 * lista dos eventos conhecidos HOJE, só para popular o filtro multiSelect da tela de auditoria.
 *
 * O NimbusDesk ainda não tem nenhum módulo de negócio (só a base: Segurança + Configurações), então
 * não existe nenhum tipo de evento de e-mail conhecido ainda. Lista VAZIA de propósito - quando um
 * módulo novo passar a enviar e-mail (ver EmailSenderService), adicione o(s) valor(es) aqui (mesmo
 * espírito do gotcha já documentado pra ui-keys.ts) - sem isso, o valor ainda aparece na listagem
 * (eventType é texto puro), só não entra como opção do filtro multiselect.
 */
export const EMAIL_LOG_EVENT_TYPE_VALUES: string[] = [];

export function emailLogEventTypeI18nKey(eventType: string): string {
  return `emailLog.eventType.${eventType}`;
}
