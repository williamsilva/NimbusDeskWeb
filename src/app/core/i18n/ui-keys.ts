/**
 * Só as chaves realmente referenciadas via `I18nService.tUi(...)` SEM `as never` (checagem de tipo
 * em tempo de compilação) - inclui `menu.*` (obrigatório por `AppMenuItem.labelKey: MenuKey`, ver
 * core/menu/menu.model.ts). Chamadas com `as never` (ex.: `tUi('profile.password.expired' as never,
 * 'Expirada')`) e usos do pipe `| translate` no HTML não passam por aqui - só precisam existir nos
 * JSONs de src/assets/i18n. Uma chave nova usada sem `as never` precisa ser adicionada aqui também
 * (mesmo espírito documentado no template original), senão o build do frontend falha com
 * TS2345/TS2322.
 */
export const UI_KEYS = {
  menu: {
    dashboard: 'menu.dashboard',
    security: {
      title: 'menu.security.title',
      users: 'menu.security.users',
      groups: 'menu.security.groups',
    },
    settings: {
      title: 'menu.settings.title',
      email: 'menu.settings.email',
      backup: 'menu.settings.backup',
      emailLog: 'menu.settings.emailLog',
    },
  },
  common: {
    success: 'common.success',
    error: 'common.error',
    warning: 'common.warning',
    to: 'common.to',
    from: 'common.from',
    until: 'common.until',
    notInformed: 'common.notInformed',
  },
  email: {
    settings: {
      saved: 'email.settings.saved',
      saveError: 'email.settings.saveError',
    },
  },
  emailLog: {
    fields: {
      recipients: 'emailLog.fields.recipients',
      subject: 'emailLog.fields.subject',
      status: 'emailLog.fields.status',
      eventType: 'emailLog.fields.eventType',
      sentAt: 'emailLog.fields.sentAt',
    },
  },
  backup: {
    settings: {
      noSelection: 'backup.settings.noSelection',
      executed: 'backup.settings.executed',
      executeError: 'backup.settings.executeError',
    },
  },
  accountPassword: {
    userFallback: 'accountPassword.userFallback',
    usernameFallback: 'accountPassword.usernameFallback',
    successTitle: 'accountPassword.successTitle',
    successMessage: 'accountPassword.successMessage',
  },
  users: {
    selection: {
      mode: {
        activate: 'users.selection.mode.activate',
        deactivate: 'users.selection.mode.deactivate',
        none: 'users.selection.mode.none',
      },
    },
    fields: {
      name: 'users.fields.name',
      userName: 'users.fields.userName',
      document: 'users.fields.document',
      status: 'users.fields.status',
      createdBy: 'users.fields.createdBy',
      createdAt: 'users.fields.createdAt',
      lastLoginAt: 'users.fields.lastLoginAt',
      blockedUntil: 'users.fields.blockedUntil',
      passwordExpiresAt: 'users.fields.passwordExpiresAt',
    },
    activate: {
      successSingle: 'users.activate.successSingle',
      header: 'users.activate.header',
      messageSingle: 'users.activate.messageSingle',
      successBulk: 'users.activate.successBulk',
      messageBulk: 'users.activate.messageBulk',
    },
    deactivate: {
      successSingle: 'users.deactivate.successSingle',
      header: 'users.deactivate.header',
      messageSingle: 'users.deactivate.messageSingle',
      successBulk: 'users.deactivate.successBulk',
      messageBulk: 'users.deactivate.messageBulk',
    },
    invite: {
      resend: 'users.invite.resend',
      resent: 'users.invite.resent',
      resendError: 'users.invite.resendError',
    },
    form: {
      updated: 'users.form.updated',
      created: 'users.form.created',
    },
    status: {
      active: 'users.status.active',
      inactive: 'users.status.inactive',
      blocked: 'users.status.blocked',
      disabled: 'users.status.disabled',
      pending_password: 'users.status.pending_password',
      null: 'users.status.null',
      unknown: 'users.status.unknown',
    },
  },
  groups: {
    fields: {
      name: 'groups.fields.name',
      description: 'groups.fields.description',
      createdBy: 'groups.fields.createdBy',
      createdAt: 'groups.fields.createdAt',
    },
    form: {
      updated: 'groups.form.updated',
      created: 'groups.form.created',
    },
  },
} as const;

type NestedValues<T> = T extends object ? { [K in keyof T]: NestedValues<T[K]> }[keyof T] : T;

export type UiKey = NestedValues<typeof UI_KEYS>;

// ✅ só keys do menu
export type MenuKey = Extract<UiKey, `menu.${string}`>;
