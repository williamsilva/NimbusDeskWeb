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

    /* Chamados de TI (com.nimbusdesk.tickets no backend) */
    TICKETS: {
      TABLE: {
        ROWS: { V1: 'tickets.table.rows' },
        STATE: { V1: 'nimbusdesk.tickets.table.state.v1' },
      },
      FILTERS: { V1: 'nimbusdesk.tickets.filters.v1' },
    },
  },
};
