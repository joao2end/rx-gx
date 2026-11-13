import { computed, toRaw, watch } from "vue";
import type { MockRede } from "~/types/mock-seed";
import type {
  ChaveClusterRx,
  ConcorrenteUsuario,
  Cronicidade,
  DepartamentoMed,
  DepartamentoRx,
  EixoCluster,
  FaixaPreco,
  GxCockpitParams,
  GxSelecaoDataset,
  GxSimuladorDataset,
  ListaPesquisaDataset,
  LojaCluster,
  Matriz5x3,
  NivelSensibilidade,
  ParametrosListaDepto,
  PerfilCluster,
  ClusterRxCustom,
  IdClusterRxCustom,
  PesquisaCompetitivaDataset,
  RxCockpitParams,
  RxSimuladorDataset,
  SensibilidadeDataset,
} from "~/types/pricing";
import { buildMatrizLookup, calculateRxSimulation, summarizeRxSimulation } from "~/utils/rx-calculator";
import { calculateGxSimulation, summarizeGxSimulation } from "~/utils/gx-calculator";
import { computeAnaliseCompetitivaRx, computeGxSelecaoP1 } from "~/utils/flow-engines";

const EIXOS_CLUSTER: EixoCluster[] = ["AUTOSSERVICO", "MARCA", "PROPAGADO", "SIMILAR", "GENERICO"];

function perfisIniciais(): Record<EixoCluster, PerfilCluster> {
  return {
    AUTOSSERVICO: "Baixa",
    MARCA: "Baixa",
    PROPAGADO: "Baixa",
    SIMILAR: "Baixa",
    GENERICO: "Baixa",
  };
}

function lojasIniciais(): LojaCluster[] {
  const lojas: LojaCluster[] = [
    { id: "L01", nome: "MANEJO", origem: "planilha", perfis: perfisIniciais() },
  ];
  for (let i = 2; i <= 11; i++) {
    const n = String(i).padStart(2, "0");
    lojas.push({
      id: `L${n}`,
      nome: `Loja ${n}`,
      origem: "demonstrativo",
      perfis: perfisIniciais(),
    });
  }
  return lojas;
}

function politicaRxInicial(): Record<DepartamentoRx, ChaveClusterRx> {
  return { MARCA: "Cluster", PROPAGADO: "Cluster", SIMILAR: "Cluster" };
}

function garantirCockpitRx(rx: RxCockpitParams) {
  rx.aliquotaImpostos ??= 0;
  rx.margemMinimaLiquida ??= 0;
  if (rx.politicaPesquisa.Cluster && !rx.politicaPesquisa["Cluster Moderado"]) {
    rx.politicaPesquisa["Cluster Moderado"] = copiaPlana(rx.politicaPesquisa.Cluster);
  }
  if (rx.politicaMatriz.Cluster && !rx.politicaMatriz["Cluster Moderado"]) {
    rx.politicaMatriz["Cluster Moderado"] = copiaPlana(rx.politicaMatriz.Cluster);
  }
  for (const dept of ["MARCA", "PROPAGADO", "SIMILAR"] as const) {
    const aj = rx.ajusteDesconto[dept];
    if (aj?.Cluster && !aj["Cluster Moderado"]) {
      aj["Cluster Moderado"] = copiaPlana(aj.Cluster);
    }
  }
}

const DEPTS_RX_COCKPIT = ["MARCA", "PROPAGADO", "SIMILAR"] as const;

function copiaPlana<T>(valor: T): T {
  return structuredClone(toRaw(valor));
}

function garantirChaveClusterRx(rx: RxCockpitParams, chave: string) {
  if (!rx.politicaPesquisa[chave] && rx.politicaPesquisa.Cluster) {
    rx.politicaPesquisa[chave] = copiaPlana(rx.politicaPesquisa.Cluster);
  }
  if (!rx.politicaMatriz[chave] && rx.politicaMatriz.Cluster) {
    rx.politicaMatriz[chave] = copiaPlana(rx.politicaMatriz.Cluster);
  }
  for (const dept of DEPTS_RX_COCKPIT) {
    const ajuste = rx.ajusteDesconto[dept];
    if (ajuste && !ajuste[chave] && ajuste.Cluster) ajuste[chave] = copiaPlana(ajuste.Cluster);
  }
}

function garantirCockpitGx(gx: GxCockpitParams) {
  gx.aliquotaImpostos ??= 0;
  gx.margemMinimaLiquida ??= 0;
}

function normalizeCat(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

export function usePricingPoc() {
  const isLoaded = useState<boolean>("poc-loaded", () => false);
  const isLoading = useState<boolean>("poc-loading", () => false);

  // Raw datasets loaded from public/data/*.json
  const sensData = useState<SensibilidadeDataset | null>("poc-sens-data", () => null);
  const gxSelecaoData = useState<GxSelecaoDataset | null>("poc-gx-sel-data", () => null);
  const listaData = useState<ListaPesquisaDataset | null>("poc-lista-data", () => null);
  const pesqData = useState<PesquisaCompetitivaDataset | null>("poc-pesq-data", () => null);
  const rxSimData = useState<RxSimuladorDataset | null>("poc-rx-sim-data", () => null);
  const gxSimData = useState<GxSimuladorDataset | null>("poc-gx-sim-data", () => null);

  // 1. Editable Sensitivity State
  const cronicidadeRx = useState<Record<string, Cronicidade>>("poc-cron-map-rx", () => ({}));
  const cronicidadeGx = useState<Record<string, Cronicidade>>("poc-cron-map-gx", () => ({}));
  const matrizSensRx = useState<Matriz5x3<NivelSensibilidade> | null>("poc-mat-sens-rx", () => null);
  const matrizSensGx = useState<Matriz5x3<NivelSensibilidade> | null>("poc-mat-sens-gx", () => null);
  const cronicidadePorDominio = { rx: cronicidadeRx, gx: cronicidadeGx };
  const matrizSensPorDominio = { rx: matrizSensRx, gx: matrizSensGx };

  // 2. Editable GX P1 Selection State
  const pesosScoreGx = useState<{ cobertura: number; quantidade: number; custo: number }>(
    "poc-gx-pesos",
    () => ({ cobertura: 0.35, quantidade: 0.45, custo: 0.2 }),
  );
  const maxPGx = useState<number>("poc-gx-max-p", () => 3);
  const gxOverridePMap = useState<Record<string, number | null>>("poc-gx-override-p", () => ({}));

  // 3. Editable Research List Parameters & Manual Overrides
  const paramsLista = useState<Record<DepartamentoMed, ParametrosListaDepto> | null>(
    "poc-lista-params",
    () => null,
  );
  const listaManualMap = useState<Record<string, boolean | null>>("poc-lista-manual", () => ({}));

  // 4. Editable Competitor Classification & RX Matrix Overrides
  const tiposConcorrenteMap = useState<Record<string, "ABRAF" | "INDEP">>("poc-conc-tipos", () => ({
    RAIA: "ABRAF",
    PACHECO: "ABRAF",
    MODERNA: "INDEP",
    "POVÃO": "INDEP",
    RETIRO: "INDEP",
    ULTRA: "INDEP",
  }));
  const rxMatrizManualOverrides = useState<Record<string, number | null>>(
    "poc-rx-matriz-manual",
    () => ({}),
  );

  // 5. Editable RX Simulator Cockpit & SKU Overrides
  const rxCockpit = useState<RxCockpitParams | null>("poc-rx-cockpit", () => null);
  const rxManualPriceMap = useState<Record<string, number | null>>("poc-rx-manual-price", () => ({}));
  const rxSeguirMap = useState<Record<string, boolean>>("poc-rx-seguir-map", () => ({}));

  // 6. Editable GX Simulator Cockpit & Chave/SKU Overrides
  const gxCockpit = useState<GxCockpitParams | null>("poc-gx-cockpit", () => null);
  const gxChaveP1ManualMap = useState<Record<string, number | null>>(
    "poc-gx-chave-p1-manual",
    () => ({}),
  );
  const gxManualPriceMap = useState<Record<string, number | null>>("poc-gx-manual-price", () => ({}));
  const gxSeguirMap = useState<Record<string, boolean>>("poc-gx-seguir-map", () => ({}));
  const gxOrdemOverrideMap = useState<Record<string, string>>("poc-gx-ordem-override", () => ({}));

  const lojas = useState<LojaCluster[]>("poc-lojas", () => lojasIniciais());
  const redeSeed = useState<MockRede | null>("poc-rede-seed", () => null);
  const clustersRxCustom = useState<ClusterRxCustom[]>("poc-rx-clusters-custom", () => []);
  const estrategiaAnterior = useState<Record<string, Record<EixoCluster, PerfilCluster>> | null>(
    "poc-estr-ant",
    () => null,
  );
  const politicaSimulacaoRx = useState<Record<DepartamentoRx, ChaveClusterRx>>(
    "poc-pol-rx",
    () => politicaRxInicial(),
  );
  const pesquisaBaseId = useState<string>("poc-pesquisa-base", () => "");
  const pesquisasEscolhidas = useState<{ rx: string[]; gx: string[] }>("poc-pesquisas-escolhidas", () => ({
    rx: [],
    gx: [],
  }));
  const revisaoAberta = useState<{ rx: boolean; gx: boolean }>("poc-revisao-aberta", () => ({
    rx: false,
    gx: false,
  }));
  const concorrentesUsuario = useState<ConcorrenteUsuario[]>("poc-conc-user", () => [
    { id: "USR-BAIRRO", nome: "FARMÁCIA DO BAIRRO", tipo: null },
  ]);

  async function ensureLoaded() {
    if (isLoaded.value || isLoading.value) return;
    isLoading.value = true;
    try {
      const base = useRuntimeConfig().public.dataBase || "/mock";
      const [sens, gxSel, lista, pesq, rxSim, gxSim] = await Promise.all([
        $fetch<SensibilidadeDataset>(`${base}/sensibilidade.json`),
        $fetch<GxSelecaoDataset>(`${base}/gx-selecao-p1.json`),
        $fetch<ListaPesquisaDataset>(`${base}/lista-pesquisa.json`),
        $fetch<PesquisaCompetitivaDataset>(`${base}/pesquisa-competitiva.json`),
        $fetch<RxSimuladorDataset>(`${base}/rx-simulador.json`),
        $fetch<GxSimuladorDataset>(`${base}/gx-simulador.json`),
      ]);
      const rede = base.endsWith("/mock") ? await $fetch<MockRede>(`${base}/rede.json`) : null;

      sensData.value = sens;
      gxSelecaoData.value = gxSel;
      listaData.value = lista;
      pesqData.value = pesq;
      rxSimData.value = rxSim;
      gxSimData.value = gxSim;

      // Hydrate editable state from Excel defaults
      const cMap: Record<string, Cronicidade> = {};
      for (const c of sens.classesCronicidade) {
        cMap[normalizeCat(c.categoria)] = c.cronicidade;
      }
      cronicidadeRx.value = { ...cMap };
      cronicidadeGx.value = { ...cMap };
      matrizSensRx.value = structuredClone(sens.matrizSensibilidade);
      matrizSensGx.value = structuredClone(sens.matrizSensibilidade);

      pesosScoreGx.value = { ...gxSel.pesosDefault };
      maxPGx.value = gxSel.maxPDefault;

      paramsLista.value = structuredClone(lista.parametrosDefault);

      const concMap: Record<string, "ABRAF" | "INDEP"> = {};
      for (const c of pesq.concorrentes) {
        concMap[c.id] = c.tipo;
      }
      tiposConcorrenteMap.value = concMap;

      const rxClone = structuredClone(rxSim.cockpitDefault);
      garantirCockpitRx(rxClone);
      rxCockpit.value = rxClone;
      const gxClone = structuredClone(gxSim.cockpitDefault);
      garantirCockpitGx(gxClone);
      gxCockpit.value = gxClone;

      const p1Man: Record<string, number | null> = {};
      for (const [k, v] of Object.entries(gxSim.chaveP1Manual)) {
        p1Man[k] = v;
      }
      gxChaveP1ManualMap.value = p1Man;

      if (rede) {
        lojas.value = rede.lojas.map((loja) => ({
          id: loja.id,
          nome: loja.nome,
          origem: loja.origem,
          perfis: { ...loja.perfis },
        }));
        clustersRxCustom.value = rede.clustersCustom.map((cluster) => ({ ...cluster }));
        for (const cluster of clustersRxCustom.value) {
          garantirChaveClusterRx(rxClone, cluster.id);
        }
        pesquisasEscolhidas.value = {
          rx: [...rede.pesquisasIniciais.rx],
          gx: [...rede.pesquisasIniciais.gx],
        };
        pesquisaBaseId.value = rede.pesquisasIniciais.rx[0] ?? "";
        redeSeed.value = rede;
      }

      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function resolveSensitivity(
    dominio: "rx" | "gx",
    categoria: string,
    faixa: string,
    fallbackCron: string,
    fallbackSens: string,
  ) {
    const matriz = matrizSensPorDominio[dominio].value;
    if (!faixa || !matriz) {
      return { cronicidade: fallbackCron, sensibilidade: fallbackSens };
    }
    const norm = normalizeCat(categoria);
    const cron = (cronicidadePorDominio[dominio].value[norm] ?? fallbackCron) as Cronicidade;
    const sens = matriz[faixa as FaixaPreco]?.[cron] ?? fallbackSens;
    return { cronicidade: cron, sensibilidade: sens };
  }

  // Computed: Competitive Analysis RX (live when ABRAF/INDEP changes!)
  const analiseCompetitivaRx = computed(() => {
    if (!pesqData.value) return { produtos: [], rankingConcorrentes: [] };
    return computeAnaliseCompetitivaRx(pesqData.value.coletasRx, tiposConcorrenteMap.value);
  });

  // Computed: GX P1 Selection Groups
  const gxSelecaoChaves = computed(() => {
    if (!gxSelecaoData.value) return [];
    return computeGxSelecaoP1(
      gxSelecaoData.value.itens,
      pesosScoreGx.value,
      maxPGx.value,
      gxOverridePMap.value,
    );
  });

  // Sync P1 selection into GX Simulator
  function aplicarPsNaSimulacaoGx(): number {
    if (!gxSimData.value) return 0;
    const pFimByPid: Record<string, string> = {};
    for (const grp of gxSelecaoChaves.value) {
      for (const lab of grp.laboratorios) {
        pFimByPid[lab.produtoId] = lab.pFimLabel;
      }
    }
    let changed = 0;
    const nextOverrides = { ...gxOrdemOverrideMap.value };
    for (const sku of gxSimData.value.skus) {
      const novoP = pFimByPid[sku.produtoId];
      if (novoP && novoP !== sku.ordemPreco) {
        nextOverrides[sku.produtoId] = novoP;
        changed++;
      }
    }
    gxOrdemOverrideMap.value = nextOverrides;
    return changed;
  }

  // Computed: Live RX Simulation
  const rxMatrizLookup = computed(() => {
    if (!rxSimData.value) return {};
    return buildMatrizLookup(rxSimData.value.matrizDesconto, rxMatrizManualOverrides.value);
  });

  const rxTopPesquisaLive = computed(() => {
    if (!rxSimData.value) return {};
    const merged = { ...rxSimData.value.topPesquisa };
    for (const p of analiseCompetitivaRx.value.produtos) {
      if (merged[p.produtoId]) {
        merged[p.produtoId] = {
          produto: p.produto,
          TODOS: p.descTodos ?? merged[p.produtoId]!.TODOS,
          ABRAF: p.descAbraf ?? merged[p.produtoId]!.ABRAF,
          INDEP: p.descIndep ?? merged[p.produtoId]!.INDEP,
        };
      }
    }
    return merged;
  });

  const rxCalculatedRows = computed(() => {
    if (!rxSimData.value || !rxCockpit.value) return [];
    const preparedSkus = rxSimData.value.skus.map((s) => {
      const { cronicidade, sensibilidade } = resolveSensitivity(
        "rx",
        s.categoria,
        s.faixa,
        s.cronicidade,
        s.sensibilidade,
      );
      const clusterSim = politicaSimulacaoRx.value[s.departamento] ?? s.cluster;
      const keyPerfil = `${s.produtoId}|${clusterSim}`;
      const keyBase = `${s.produtoId}|${s.cluster}`;
      const manual =
        rxManualPriceMap.value[keyPerfil] !== undefined
          ? rxManualPriceMap.value[keyPerfil]!
          : rxManualPriceMap.value[keyBase] !== undefined
            ? rxManualPriceMap.value[keyBase]!
            : s.ajusteManual;
      const seguir =
        rxSeguirMap.value[keyPerfil] !== undefined
          ? rxSeguirMap.value[keyPerfil]!
          : rxSeguirMap.value[keyBase] !== undefined
            ? rxSeguirMap.value[keyBase]!
            : s.seguir;
      return {
        ...s,
        cluster: clusterSim,
        cronicidade,
        sensibilidade,
        ajusteManual: manual,
        seguir,
      };
    });
    const pesquisaRx = pesquisasEscolhidas.value.rx.includes("rx-competitiva-rj")
      ? rxTopPesquisaLive.value
      : {};
    return calculateRxSimulation(
      preparedSkus,
      rxCockpit.value,
      pesquisaRx,
      rxMatrizLookup.value,
    );
  });

  const rxSummary = computed(() => summarizeRxSimulation(rxCalculatedRows.value));

  // Computed: Live GX Simulation
  const gxSimulationResult = computed(() => {
    if (!gxSimData.value || !gxCockpit.value) return { p1Map: {}, rows: [] };

    const preparedSkus = gxSimData.value.skus.map((s) => {
      const { cronicidade, sensibilidade } = resolveSensitivity(
        "gx",
        s.categoria,
        s.faixa,
        s.cronicidade,
        s.sensibilidade,
      );
      const key = `${s.produtoId}|${s.cluster}`;
      const ordem = gxOrdemOverrideMap.value[s.produtoId] ?? s.ordemPreco;
      return {
        ...s,
        cronicidade,
        sensibilidade,
        ordemPreco: ordem,
        ajusteManual:
          gxManualPriceMap.value[key] !== undefined ? gxManualPriceMap.value[key]! : s.ajusteManual,
        seguirPrecoP1: s.seguirPrecoP1,
        seguir: gxSeguirMap.value[key] !== undefined ? gxSeguirMap.value[key]! : s.seguir,
      };
    });

    // Also keep p1Rows aligned if user swapped who is P1 in a Chave
    const p1RowsEffective = gxSimData.value.p1Rows.map((p) => {
      const { cronicidade, sensibilidade } = resolveSensitivity(
        "gx",
        p.categoria,
        p.faixa,
        p.cronicidade,
        p.sensibilidade,
      );
      // Check if another SKU in this chave became P1 via override
      const overriddenP1 = preparedSkus.find(
        (s) => s.chave === p.chave && s.cluster === p.cluster && s.ordemPreco === "P1",
      );
      if (overriddenP1 && overriddenP1.produtoId !== p.produtoId) {
        return {
          ...p,
          produtoId: overriddenP1.produtoId,
          descricao: overriddenP1.descricao,
          laboratorio: overriddenP1.laboratorio,
          custo: overriddenP1.custo,
          custoComComissao: overriddenP1.custoComComissao,
          pmc: overriddenP1.pmc,
          precoAtual: overriddenP1.precoAtual,
          cronicidade,
          sensibilidade,
        };
      }
      return { ...p, cronicidade, sensibilidade };
    });

    const ids = pesquisasEscolhidas.value.gx;
    return calculateGxSimulation(
      p1RowsEffective,
      preparedSkus,
      gxCockpit.value,
      ids.includes("gx-manual-rj") ? gxSimData.value.pesqManual : {},
      ids.includes("gx-internet-rj") ? gxSimData.value.pesqInternet : {},
      gxChaveP1ManualMap.value,
    );
  });

  const gxCalculatedRows = computed(() => gxSimulationResult.value.rows);
  const gxSummary = computed(() => summarizeGxSimulation(gxCalculatedRows.value));

  watch(rxCockpit, (rx) => {
    if (!rx) return;
    garantirCockpitRx(rx);
    for (const cluster of clustersRxCustom.value) garantirChaveClusterRx(rx, cluster.id);
  }, { immediate: true });
  watch(gxCockpit, (gx) => { if (gx) garantirCockpitGx(gx); }, { immediate: true });

  function escolherPesquisas(dominio: "rx" | "gx", ids: string[]) {
    pesquisasEscolhidas.value = { ...pesquisasEscolhidas.value, [dominio]: ids };
    pesquisaBaseId.value = ids[0] ?? "";
  }

  function limparPesquisas(dominio: "rx" | "gx") {
    escolherPesquisas(dominio, []);
  }

  function setPerfilLoja(lojaId: string, eixo: EixoCluster, perfil: PerfilCluster) {
    const loja = lojas.value.find((l) => l.id === lojaId);
    if (loja) loja.perfis[eixo] = perfil;
  }

  function nomePerfilCluster(perfil: PerfilCluster) {
    if (perfil === "Alta" || perfil === "Moderado" || perfil === "Baixa") return perfil;
    return clustersRxCustom.value.find((cluster) => cluster.id === perfil)?.nome ?? "Cluster";
  }

  function criarClusterRx(nome: string) {
    const limpo = nome.trim();
    const rx = rxCockpit.value;
    if (!limpo || !rx) return null;
    const id = `rxc_${crypto.randomUUID()}` as IdClusterRxCustom;
    garantirChaveClusterRx(rx, id);
    clustersRxCustom.value = [...clustersRxCustom.value, { id, nome: limpo }];
    return id;
  }

  function removerClusterRx(id: IdClusterRxCustom) {
    for (const loja of lojas.value) {
      for (const dept of DEPTS_RX_COCKPIT) {
        if (loja.perfis[dept] === id) setPerfilLoja(loja.id, dept, "Baixa");
      }
    }
    const rx = rxCockpit.value;
    if (rx) {
      delete rx.politicaPesquisa[id];
      delete rx.politicaMatriz[id];
      for (const dept of DEPTS_RX_COCKPIT) {
        const ajuste = rx.ajusteDesconto[dept];
        if (ajuste) delete ajuste[id];
      }
    }
    clustersRxCustom.value = clustersRxCustom.value.filter((cluster) => cluster.id !== id);
  }

  function guardarEstrategiaAnterior() {
    const snap: Record<string, Record<EixoCluster, PerfilCluster>> = {};
    for (const loja of lojas.value) {
      snap[loja.id] = { ...loja.perfis };
    }
    estrategiaAnterior.value = snap;
  }

  function adicionarConcorrenteUsuario(nome: string) {
    const limpo = nome.trim().toUpperCase();
    if (!limpo) return;
    const id = `USR-${limpo.replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24)}`;
    if (concorrentesUsuario.value.some((c) => c.id === id)) return;
    concorrentesUsuario.value = [...concorrentesUsuario.value, { id, nome: limpo, tipo: null }];
  }

  function classificarConcorrenteUsuario(id: string, tipo: "ABRAF" | "INDEP") {
    concorrentesUsuario.value = concorrentesUsuario.value.map((c) => (c.id === id ? { ...c, tipo } : c));
    tiposConcorrenteMap.value = { ...tiposConcorrenteMap.value, [id]: tipo };
  }

  function resetRxDefaults() {
    if (!rxSimData.value) return;
    const rxClone = structuredClone(rxSimData.value.cockpitDefault);
    garantirCockpitRx(rxClone);
    rxCockpit.value = rxClone;
    politicaSimulacaoRx.value = politicaRxInicial();
    rxMatrizManualOverrides.value = {};
    rxManualPriceMap.value = {};
    rxSeguirMap.value = {};
  }

  function resetGxDefaults() {
    if (!gxSimData.value) return;
    const gxClone = structuredClone(gxSimData.value.cockpitDefault);
    garantirCockpitGx(gxClone);
    gxCockpit.value = gxClone;
    const p1Man: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(gxSimData.value.chaveP1Manual)) {
      p1Man[k] = v;
    }
    gxChaveP1ManualMap.value = p1Man;
    gxManualPriceMap.value = {};
    gxSeguirMap.value = {};
    gxOrdemOverrideMap.value = {};
  }

  return {
    isLoaded,
    isLoading,
    ensureLoaded,
    sensData,
    gxSelecaoData,
    listaData,
    pesqData,
    rxSimData,
    gxSimData,
    cronicidadePorDominio,
    matrizSensPorDominio,
    pesosScoreGx,
    maxPGx,
    gxOverridePMap,
    gxSelecaoChaves,
    aplicarPsNaSimulacaoGx,
    paramsLista,
    listaManualMap,
    tiposConcorrenteMap,
    analiseCompetitivaRx,
    rxMatrizManualOverrides,
    rxMatrizLookup,
    rxCockpit,
    rxManualPriceMap,
    rxSeguirMap,
    rxCalculatedRows,
    rxSummary,
    resetRxDefaults,
    gxCockpit,
    gxChaveP1ManualMap,
    gxManualPriceMap,
    gxSeguirMap,
    gxOrdemOverrideMap,
    gxCalculatedRows,
    gxSummary,
    resetGxDefaults,
    lojas,
    redeSeed,
    clustersRxCustom,
    criarClusterRx,
    removerClusterRx,
    nomePerfilCluster,
    estrategiaAnterior,
    politicaSimulacaoRx,
    pesquisaBaseId,
    pesquisasEscolhidas,
    revisaoAberta,
    escolherPesquisas,
    limparPesquisas,
    concorrentesUsuario,
    setPerfilLoja,
    guardarEstrategiaAnterior,
    adicionarConcorrenteUsuario,
    classificarConcorrenteUsuario,
    eixosCluster: EIXOS_CLUSTER,
  };
}
