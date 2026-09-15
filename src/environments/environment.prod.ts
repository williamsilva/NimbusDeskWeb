// Deploy de produção real (Railway) — mesmo padrão de CardSyncWeb/CardsyncServer.
// bffBaseUrl/apiBaseUrl apontam pro NimbusDeskServer publicado em desk-api.nimbussystems.com.br.
export const environment = {
  production: true,
  bffBaseUrl: 'https://desk-api.nimbussystems.com.br',
  apiBaseUrl: 'https://desk-api.nimbussystems.com.br',
  nimbusAuthWebUrl: 'https://nimbussystems.com.br',
};
