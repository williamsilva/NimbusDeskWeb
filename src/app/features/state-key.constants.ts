export const STATE_KEY = {
  NIMBUSDESK: {
    /* Segurança */
    SECURITY: {
      USERS: {
        TABLE: {
          ROWS: { V1: 'users.table.rows' },
          STATE: { V1: 'nimbusdesk.users.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusdesk.users.filters.v1' },
      },
      GROUPS: {
        TABLE: {
          ROWS: { V1: 'groups.table.rows' },
          STATE: { V1: 'nimbusdesk.groups.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusdesk.groups.filters.v1' },
      },
    },

    /* Configurações > Auditoria de E-mail (com.nimbusdesk.common.notification.mail no backend) */
    SETTINGS: {
      EMAIL_LOG: {
        TABLE: {
          ROWS: { V1: 'email-log.table.rows' },
          STATE: { V1: 'nimbusdesk.email-log.table.state.v1' },
        },
        FILTERS: { V1: 'nimbusdesk.email-log.filters.v1' },
      },
    },
  },
};
