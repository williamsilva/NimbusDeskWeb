export const environment = {
  production: false,
  bffBaseUrl: 'http://localhost:9094',
  apiBaseUrl: 'http://localhost:9094',
  // NimbusAuthWeb roda em ng serve na mesma porta padrão (4200) - pra testar o link de
  // Segurança > Usuários/Grupos de verdade em dev, suba este app noutra porta
  // (ng serve --port 4201) enquanto o NimbusAuthWeb ocupa a 4200.
  nimbusAuthWebUrl: 'http://localhost:4200',
};
