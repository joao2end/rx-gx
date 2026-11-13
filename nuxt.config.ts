export default defineNuxtConfig({
  extends: ["ads-nuxt"],
  compatibilityDate: "2025-06-17",
  devtools: { enabled: false },
  devServer: {
    port: 3005,
  },
  runtimeConfig: {
    public: {
      /** /mock é a base falsa. /data é o extrato das planilhas. */
      dataBase: "/mock",
    },
  },
  app: {
    head: {
      title: "Radar Pricing · Medicamentos RX & GX (POC)",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "POC do fluxo integrado de precificação de Medicamentos RX (Marca, Propagado, Similar) e GX (Genéricos por Chave)",
        },
      ],
    },
  },
  routeRules: {
    "/sensibilidade": { redirect: "/rx/sensibilidade" },
    "/gx-selecao-p1": { redirect: "/gx/ps" },
    "/lista-pesquisa": { redirect: "/pesquisa?d=rx" },
    "/pesquisa-competitiva": { redirect: "/pesquisa?d=rx" },
    "/estrategia/pesquisa": { redirect: "/pesquisa" },
    "/clusterizacao": { redirect: "/estrategia/clusterizacao" },
    "/simulador-rx": { redirect: "/rx/simulacao" },
    "/simulador-gx": { redirect: "/gx/simulacao" },
    "/exportacao": { redirect: "/rx/exportacao" },
  },
});
