import type {
  CandidatoLista,
  ColetaRxRow,
  Cronicidade,
  DepartamentoMed,
  FaixaPreco,
  GxCalculatedSku,
  GxSelecaoItem,
  Matriz5x3,
  NivelSensibilidade,
  ParametrosListaDepto,
  RxCalculatedSku,
} from "../types/pricing";

export const FAIXAS_ORDEM: FaixaPreco[] = [
  "FAIXA 5",
  "FAIXA 4",
  "FAIXA 3",
  "FAIXA 2",
  "FAIXA 1",
];

export const CRONICIDADES_ORDEM: Cronicidade[] = ["EVENTUAL", "FREQUENTE", "CRONICO"];

export interface GxChaveGroup {
  chave: string;
  indexChave: number;
  receitaTotal3m: number;
  qtdTotal3m: number;
  coberturaMax: number;
  p1Atual: GxSelecaoComputedItem | null;
  temAlteracaoManual: boolean;
  laboratorios: GxSelecaoComputedItem[];
}

export interface GxSelecaoComputedItem extends GxSelecaoItem {
  scoreQtdCalc: number;
  scoreCustoCalc: number;
  scoreFinalCalc: number;
  sugestaoCalc: string;
  ordemSugeridaNum: number;
  pFimCalc: number;
  pFimLabel: string;
}

export function computeGxSelecaoP1(
  itens: GxSelecaoItem[],
  pesos: { cobertura: number; quantidade: number; custo: number },
  maxP: number,
  manualOverrides: Record<string, number | null>,
): GxChaveGroup[] {
  const byChave = new Map<string, GxSelecaoItem[]>();
  for (const item of itens) {
    if (!item.chave) continue;
    const arr = byChave.get(item.chave) ?? [];
    arr.push(item);
    byChave.set(item.chave, arr);
  }

  const groups: GxChaveGroup[] = [];

  for (const [chave, labs] of byChave.entries()) {
    const totalQtd = labs.reduce((acc, l) => acc + (l.qtd3m || 0), 0);
    const validCosts = labs.map((l) => l.custoAtual).filter((c) => c > 0);
    const maxCost = validCosts.length ? Math.max(...validCosts) : 0;
    const minCost = validCosts.length ? Math.min(...validCosts) : 0;

    const scored = labs.map((l) => {
      const scoreQtdCalc = totalQtd > 0 ? l.qtd3m / totalQtd : 0;
      const scoreCustoCalc =
        maxCost > minCost && l.custoAtual > 0
          ? (maxCost - l.custoAtual) / (maxCost - minCost)
          : 0;
      const scoreFinalCalc =
        l.coberturaLojas * pesos.cobertura +
        scoreQtdCalc * pesos.quantidade +
        scoreCustoCalc * pesos.custo;
      return { raw: l, scoreQtdCalc, scoreCustoCalc, scoreFinalCalc };
    });

    scored.sort((a, b) => {
      if (Math.abs(b.scoreFinalCalc - a.scoreFinalCalc) > 1e-6) {
        return b.scoreFinalCalc - a.scoreFinalCalc;
      }
      return b.raw.receita3m - a.raw.receita3m;
    });

    const computedLabs: GxSelecaoComputedItem[] = scored.map((s, idx) => {
      const ordemSugeridaNum = idx + 1;
      const sugestaoCalc = `P${ordemSugeridaNum}`;
      const overrideVal =
        manualOverrides[s.raw.produtoId] !== undefined
          ? manualOverrides[s.raw.produtoId]!
          : s.raw.overrideP;
      const pFimCalc =
        overrideVal !== null && overrideVal !== undefined && overrideVal > 0
          ? overrideVal
          : Math.min(ordemSugeridaNum, maxP);
      return {
        ...s.raw,
        overrideP: overrideVal ?? null,
        scoreQtdCalc: s.scoreQtdCalc,
        scoreCustoCalc: s.scoreCustoCalc,
        scoreFinalCalc: s.scoreFinalCalc,
        sugestaoCalc,
        ordemSugeridaNum,
        pFimCalc,
        pFimLabel: `P${pFimCalc}`,
      };
    });

    const p1Atual = computedLabs.find((l) => l.pFimCalc === 1) ?? computedLabs[0] ?? null;
    const receitaTotal3m = computedLabs.reduce((acc, l) => acc + l.receita3m, 0);
    const coberturaMax = computedLabs.reduce((acc, l) => Math.max(acc, l.coberturaLojas), 0);
    const indexChave = computedLabs.reduce((acc, l) => Math.min(acc, l.indexChave), 9999);
    const temAlteracaoManual = computedLabs.some((l) => l.overrideP !== null);

    groups.push({
      chave,
      indexChave,
      receitaTotal3m,
      qtdTotal3m: totalQtd,
      coberturaMax,
      p1Atual,
      temAlteracaoManual,
      laboratorios: computedLabs,
    });
  }

  groups.sort((a, b) => b.receitaTotal3m - a.receitaTotal3m);
  return groups;
}

export interface CandidatoListaCalculado extends CandidatoLista {
  precoMedioVenda: number;
  elegivel: boolean;
  motivoInelegivel: string;
  rankReceita: number | null;
  rankQuantidade: number | null;
  scoreCombinado: number | null;
  selecionadoAuto: boolean;
  selecionadoFinal: boolean;
  origemSelecao: string;
}

export function computeListaPesquisa(
  candidatos: CandidatoLista[],
  departamento: DepartamentoMed,
  params: ParametrosListaDepto,
  manualMap: Record<string, boolean | null>,
): {
  itens: CandidatoListaCalculado[];
  quadrantes: Matriz5x3<{ elegiveis: number; selecionados: number }>;
} {
  const pool = candidatos.filter((c) => c.departamento === departamento);

  const avaliados = pool.map((c) => {
    const precoMedioVenda = c.quantidade > 0 && c.receita > 0 ? c.receita / c.quantidade : c.pmc;
    const motivos: string[] = [];
    if (c.receita <= 0 || c.quantidade <= 0) motivos.push("Sem venda no período");
    if (!params.pbm && c.pbm) motivos.push("PBM bloqueado");
    if (!params.farmaciaPopular && c.farmaciaPopular) motivos.push("Farmácia Popular bloqueada");
    if (!params.marcaPropria && c.marcaPropria) motivos.push("Marca Própria bloqueada");
    if (!params.precoTabelado && c.precoTabelado) motivos.push("Preço Tabelado bloqueado");
    if (params.precoMaximo > 0 && precoMedioVenda > params.precoMaximo) {
      motivos.push(`Preço médio > R$ ${params.precoMaximo}`);
    }
    return {
      raw: c,
      precoMedioVenda,
      elegivel: motivos.length === 0,
      motivoInelegivel: motivos.join(" · "),
    };
  });

  const elegiveis = avaliados.filter((a) => a.elegivel);

  const byRec = [...elegiveis].sort((a, b) => b.raw.receita - a.raw.receita);
  const rankRecMap = new Map<string, number>();
  byRec.forEach((item, idx) => rankRecMap.set(item.raw.id, idx + 1));

  const byQtd = [...elegiveis].sort((a, b) => b.raw.quantidade - a.raw.quantidade);
  const rankQtdMap = new Map<string, number>();
  byQtd.forEach((item, idx) => rankQtdMap.set(item.raw.id, idx + 1));

  // Quota split exactly like Excel: roundDown(meta * pesoReceita) by Revenue, remainder by Complementary Quantity
  const metaTotal = Math.max(1, params.qtdMeta);
  const metaReceita = Math.floor(metaTotal * params.pesoReceita);
  const metaQuantidade = Math.max(0, metaTotal - metaReceita);

  const selReceitaIds = new Set(byRec.slice(0, metaReceita).map((x) => x.raw.id));
  const compQtdIds = new Set(
    byQtd
      .filter((x) => !selReceitaIds.has(x.raw.id))
      .slice(0, metaQuantidade)
      .map((x) => x.raw.id),
  );

  const quadrantes: Matriz5x3<{ elegiveis: number; selecionados: number }> = {
    "FAIXA 5": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
    "FAIXA 4": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
    "FAIXA 3": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
    "FAIXA 2": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
    "FAIXA 1": { EVENTUAL: { elegiveis: 0, selecionados: 0 }, FREQUENTE: { elegiveis: 0, selecionados: 0 }, CRONICO: { elegiveis: 0, selecionados: 0 } },
  };

  const itens: CandidatoListaCalculado[] = avaliados.map((a) => {
    const id = a.raw.id;
    const rankReceita = rankRecMap.get(id) ?? null;
    const rankQuantidade = rankQtdMap.get(id) ?? null;
    const scoreCombinado =
      rankReceita !== null && rankQuantidade !== null
        ? rankReceita * params.pesoReceita + rankQuantidade * params.pesoQuantidade
        : null;

    const isRec = selReceitaIds.has(id);
    const isQtd = compQtdIds.has(id);
    const selecionadoAuto = isRec || isQtd;

    const manualOverride =
      manualMap[id] !== undefined
        ? manualMap[id]
        : a.raw.selecaoManual !== null
          ? a.raw.selecaoManual === 1
          : null;

    const selecionadoFinal = manualOverride !== null ? manualOverride : selecionadoAuto;

    let origemSelecao = "Não selecionado";
    if (manualOverride === true) origemSelecao = "MANUAL · INCLUÍDO";
    else if (manualOverride === false) origemSelecao = "MANUAL · EXCLUÍDO";
    else if (isRec) origemSelecao = "RECEITA (70%)";
    else if (isQtd) origemSelecao = "QUANTIDADE (30%)";

    const f = a.raw.faixa as FaixaPreco;
    const c = a.raw.cronicidade as Cronicidade;
    if (quadrantes[f]?.[c]) {
      if (a.elegivel) quadrantes[f][c].elegiveis++;
      if (selecionadoFinal) quadrantes[f][c].selecionados++;
    }

    return {
      ...a.raw,
      precoMedioVenda: a.precoMedioVenda,
      elegivel: a.elegivel,
      motivoInelegivel: a.motivoInelegivel,
      rankReceita,
      rankQuantidade,
      scoreCombinado,
      selecionadoAuto,
      selecionadoFinal,
      origemSelecao,
    };
  });

  itens.sort((a, b) => {
    if (a.selecionadoFinal !== b.selecionadoFinal) return a.selecionadoFinal ? -1 : 1;
    if (a.elegivel !== b.elegivel) return a.elegivel ? -1 : 1;
    return (a.scoreCombinado ?? 99999) - (b.scoreCombinado ?? 99999);
  });

  return { itens, quadrantes };
}

function percentileInc(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  const next = sorted[base + 1] ?? sorted[base]!;
  return sorted[base]! + rest * (next - sorted[base]!);
}

export interface ProdutoPesquisaRxResumo {
  produtoId: string;
  produto: string;
  departamento: string;
  categoria: string;
  sensibilidade: string;
  pmc: number;
  precoRede: number;
  descRede: number;
  receita: number;
  descTodos: number | null;
  descAbraf: number | null;
  descIndep: number | null;
  qtdColetasValidas: number;
  qtdOutliers: number;
  precosPorConcorrente: Record<
    string,
    { preco: number; desc: number; valido: boolean; motivoOutlier?: string }
  >;
}

export function computeAnaliseCompetitivaRx(
  coletas: ColetaRxRow[],
  tiposConcorrenteMap: Record<string, "ABRAF" | "INDEP">,
): {
  produtos: ProdutoPesquisaRxResumo[];
  rankingConcorrentes: Array<{
    concorrente: string;
    tipo: "ABRAF" | "INDEP";
    descMedioPonderado: number;
    skusMenorPreco: number;
    coletasValidas: number;
  }>;
} {
  const byProd = new Map<string, ColetaRxRow[]>();
  for (const row of coletas) {
    const arr = byProd.get(row.produtoId) ?? [];
    arr.push(row);
    byProd.set(row.produtoId, arr);
  }

  const produtos: ProdutoPesquisaRxResumo[] = [];
  const concStats: Record<
    string,
    { pesoDesc: number; pesoRec: number; menorPrecoCount: number; validas: number }
  > = {};

  for (const [produtoId, rows] of byProd.entries()) {
    const first = rows[0]!;
    const precos = rows.map((r) => r.precoConc).sort((a, b) => a - b);
    const q1 = percentileInc(precos, 0.25);
    const q3 = percentileInc(precos, 0.75);
    const iqr = q3 - q1;
    const li = q1 - 1.5 * iqr;
    const ls = q3 + 1.5 * iqr;

    // Count per Tipo Conc
    const countByTipo = { ABRAF: 0, INDEP: 0 };
    for (const r of rows) {
      const t = tiposConcorrenteMap[r.concorrente] ?? r.tipoConc;
      countByTipo[t]++;
    }

    const precosPorConcorrente: ProdutoPesquisaRxResumo["precosPorConcorrente"] = {};
    const validDescsTodos: number[] = [];
    const validDescsAbraf: number[] = [];
    const validDescsIndep: number[] = [];
    let minValidPrice = Infinity;
    let qtdOutliers = 0;

    for (const r of rows) {
      const tipo = tiposConcorrenteMap[r.concorrente] ?? r.tipoConc;
      const acimaPmc = r.pmc > 0 && r.precoConc >= r.pmc;
      const foraIqr = r.precoConc < li - 1e-6 || r.precoConc > ls + 1e-6;
      const semAmostraTipo = countByTipo[tipo] <= 1;
      const valido = !acimaPmc && !foraIqr && !semAmostraTipo;

      let motivoOutlier: string | undefined;
      if (acimaPmc) motivoOutlier = "Preço >= PMC";
      else if (foraIqr) motivoOutlier = "Outlier IQR";
      else if (semAmostraTipo) motivoOutlier = "Amostra única no canal";

      if (!valido) qtdOutliers++;
      const desc = r.pmc > 0 ? 1 - r.precoConc / r.pmc : r.descConc;
      precosPorConcorrente[r.concorrente] = {
        preco: r.precoConc,
        desc,
        valido,
        motivoOutlier,
      };

      if (valido) {
        validDescsTodos.push(desc);
        if (tipo === "ABRAF") validDescsAbraf.push(desc);
        else validDescsIndep.push(desc);
        if (r.precoConc < minValidPrice) minValidPrice = r.precoConc;

        if (!concStats[r.concorrente]) {
          concStats[r.concorrente] = { pesoDesc: 0, pesoRec: 0, menorPrecoCount: 0, validas: 0 };
        }
        concStats[r.concorrente]!.pesoDesc += desc * r.receita;
        concStats[r.concorrente]!.pesoRec += r.receita;
        concStats[r.concorrente]!.validas += 1;
      }
    }

    // Award lowest price count
    if (Number.isFinite(minValidPrice)) {
      for (const [conc, info] of Object.entries(precosPorConcorrente)) {
        if (info.valido && Math.abs(info.preco - minValidPrice) < 0.01) {
          if (concStats[conc]) concStats[conc]!.menorPrecoCount += 1;
        }
      }
    }

    const avg = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    produtos.push({
      produtoId,
      produto: first.produto,
      departamento: first.departamento,
      categoria: first.categoria,
      sensibilidade: first.sensibilidade,
      pmc: first.pmc,
      precoRede: first.precoRedeMed,
      descRede: first.descRedeMed,
      receita: first.receita,
      descTodos: avg(validDescsTodos),
      descAbraf: avg(validDescsAbraf),
      descIndep: avg(validDescsIndep),
      qtdColetasValidas: validDescsTodos.length,
      qtdOutliers,
      precosPorConcorrente,
    });
  }

  produtos.sort((a, b) => b.receita - a.receita);

  const rankingConcorrentes = Object.entries(concStats)
    .map(([concorrente, st]) => ({
      concorrente,
      tipo: tiposConcorrenteMap[concorrente] ?? ("INDEP" as const),
      descMedioPonderado: st.pesoRec > 0 ? st.pesoDesc / st.pesoRec : 0,
      skusMenorPreco: st.menorPrecoCount,
      coletasValidas: st.validas,
    }))
    .sort((a, b) => b.descMedioPonderado - a.descMedioPonderado);

  return { produtos, rankingConcorrentes };
}

export function buildPlugPharmaCsv(
  rxRows: RxCalculatedSku[],
  gxRows: GxCalculatedSku[],
  mode: "tabloide" | "desconto" | "auditoria",
): string {
  const lines: string[] = [];
  if (mode === "desconto") {
    lines.push(
      "ORIGEM;CLUSTER;PRODUTO_ID;DESCRICAO;DEPARTAMENTO;CHAVE_OU_LAB;PMC;PRECO_ATUAL;PRECO_FINAL;DESCONTO_PMC_PCT;MARGEM_FINAL_PCT;RECOMENDACAO",
    );
    for (const r of rxRows) {
      if (r.pmc <= 0 || !r.seguir) continue;
      lines.push(
        [
          "RX",
          r.cluster,
          r.produtoId,
          `"${r.descricao.replace(/"/g, '""')}"`,
          r.departamento,
          `"${r.laboratorio}"`,
          r.pmc.toFixed(2).replace(".", ","),
          r.precoAtual.toFixed(2).replace(".", ","),
          r.precoFinal.toFixed(2).replace(".", ","),
          (r.descontoSimulado * 100).toFixed(2).replace(".", ","),
          (r.margemFinal * 100).toFixed(2).replace(".", ","),
          r.alteracaoStatus,
        ].join(";"),
      );
    }
    for (const g of gxRows) {
      if (g.pmc <= 0 || !g.seguir) continue;
      lines.push(
        [
          "GX",
          g.cluster,
          g.produtoId,
          `"${g.descricao.replace(/"/g, '""')}"`,
          `GENERICO (${g.ordemPreco})`,
          `"${g.chave}"`,
          g.pmc.toFixed(2).replace(".", ","),
          g.precoAtual.toFixed(2).replace(".", ","),
          g.precoFinal.toFixed(2).replace(".", ","),
          (g.descontoSimulado * 100).toFixed(2).replace(".", ","),
          (g.margemFinal * 100).toFixed(2).replace(".", ","),
          g.alteracaoStatus,
        ].join(";"),
      );
    }
  } else if (mode === "tabloide") {
    lines.push("ORIGEM;CLUSTER;PRODUTO_ID;DESCRICAO;PRECO_DE_PMC;PRECO_POR_FINAL;DESCONTO_PCT");
    for (const r of rxRows) {
      if (r.pmc <= 0 || r.alteracaoStatus === "Manter o preço") continue;
      lines.push(
        [
          "RX",
          r.cluster,
          r.produtoId,
          `"${r.descricao.replace(/"/g, '""')}"`,
          r.pmc.toFixed(2).replace(".", ","),
          r.precoFinal.toFixed(2).replace(".", ","),
          (r.descontoSimulado * 100).toFixed(2).replace(".", ","),
        ].join(";"),
      );
    }
    for (const g of gxRows) {
      if (g.pmc <= 0 || g.alteracaoStatus === "Manter o preço") continue;
      lines.push(
        [
          "GX",
          g.cluster,
          g.produtoId,
          `"${g.descricao.replace(/"/g, '""')}"`,
          g.pmc.toFixed(2).replace(".", ","),
          g.precoFinal.toFixed(2).replace(".", ","),
          (g.descontoSimulado * 100).toFixed(2).replace(".", ","),
        ].join(";"),
      );
    }
  } else {
    lines.push(
      "ORIGEM;PRODUTO_ID;DESCRICAO;METODO;SENSIBILIDADE;CUSTO;PMC;PRECO_ATUAL;PRECO_PARTIDA;APOS_VARIACAO;APOS_MARGEM;PRECO_FINAL;MOTIVO",
    );
    for (const r of rxRows) {
      lines.push(
        [
          "RX",
          r.produtoId,
          `"${r.descricao.replace(/"/g, '""')}"`,
          r.tipoPrecificacao,
          r.sensibilidade,
          r.custoComComissao.toFixed(2).replace(".", ","),
          r.pmc.toFixed(2).replace(".", ","),
          r.precoAtual.toFixed(2).replace(".", ","),
          r.precoPartida.toFixed(2).replace(".", ","),
          r.precoAposVariacao.toFixed(2).replace(".", ","),
          r.precoAposMargem.toFixed(2).replace(".", ","),
          r.precoFinal.toFixed(2).replace(".", ","),
          `"${r.motivoRegra}"`,
        ].join(";"),
      );
    }
    for (const g of gxRows) {
      lines.push(
        [
          `GX-${g.ordemPreco}`,
          g.produtoId,
          `"${g.descricao.replace(/"/g, '""')}"`,
          g.tipoPrecificacao,
          g.sensibilidade,
          g.custoComComissao.toFixed(2).replace(".", ","),
          g.pmc.toFixed(2).replace(".", ","),
          g.precoAtual.toFixed(2).replace(".", ","),
          g.precoPartida.toFixed(2).replace(".", ","),
          g.precoAposVariacao.toFixed(2).replace(".", ","),
          g.precoAposMargem.toFixed(2).replace(".", ","),
          g.precoFinal.toFixed(2).replace(".", ","),
          `"${g.motivoRegra}"`,
        ].join(";"),
      );
    }
  }
  return "\uFEFF" + lines.join("\n");
}
