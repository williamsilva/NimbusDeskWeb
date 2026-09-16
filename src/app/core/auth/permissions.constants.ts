export const PERMISSIONS = {
  SUPPORT: 'SUPPORT',

  /* Chamados de TI (com.nimbusdesk.tickets no backend, app_key='nimbusdesk') - ver PROJECT_SPEC.md */
  CHAMADO: {
    VIEW: 'CHAMADO_CONSULT',
    MANAGE: 'CHAMADO_MANAGE',
  },

  CATEGORIA: {
    VIEW: 'CATEGORIA_CONSULT',
    MANAGE: 'CATEGORIA_MANAGE',
  },

  SLA: {
    VIEW: 'SLA_CONSULT',
    MANAGE: 'SLA_MANAGE',
  },

  /* Sufixo _TI pra não colidir com um futuro "Setor" de outro domínio, ver PROJECT_SPEC.md. */
  SETOR_TI: {
    VIEW: 'SETOR_TI_CONSULT',
    MANAGE: 'SETOR_TI_MANAGE',
  },

  /* Só leitura - escrita é exclusiva do job de sync, sem MANAGE. */
  EQUIPAMENTO_REF: {
    VIEW: 'EQUIPAMENTO_REF_CONSULT',
  },

  /* Configurações > Automação de chamados (2026-09-09) - periodicidade dos jobs de alerta
   *  (sem responsável / pendência de resposta) e de auto-fechamento. */
  TICKET_AUTOMATION: {
    VIEW: 'TICKET_AUTOMATION_CONSULT',
    MANAGE: 'TICKET_AUTOMATION_MANAGE',
  },
} as const;

type ValueOf<T> = T[keyof T];
type DeepValueOf<T> = T extends object ? DeepValueOf<ValueOf<T>> : T;

export type Permission = DeepValueOf<typeof PERMISSIONS>;
